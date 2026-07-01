(function () {
  "use strict";

  function parseJobPage() {
    const context = createPageContext();
    const applicationCandidates = parseApplicationCards(context);
    if (applicationCandidates.length > 0) {
      return {
        ...applicationCandidates[0],
        candidates: applicationCandidates
      };
    }

    return parseJobDetailPage(context);
  }

  function createPageContext() {
    const host = location.hostname.replace(/^www\./, "");
    const titleText = cleanText(document.title);
    const lines = readVisibleLines();
    return {
      host,
      titleText,
      lines,
      visibleText: lines.join("\n"),
      today: new Date().toISOString().slice(0, 10)
    };
  }

  function parseJobDetailPage(context) {
    const jsonLd = readJobPostingJsonLd();
    const titleText = context.titleText;
    const h1Text = cleanText(document.querySelector("h1") ? document.querySelector("h1").textContent : "");
    const description = readMeta('meta[name="description"]');
    const host = context.host;
    const today = context.today;

    const role = firstNonEmpty(
      jsonLd.title,
      h1Text,
      stripSiteName(titleText),
      titleText
    );
    const company = sanitizeCompanyName(firstNonEmpty(
      getHiringOrganizationName(jsonLd),
      readMeta("meta[property=\"og:site_name\"]"),
      inferCompanyFromTitle(titleText),
      inferCompanyFromHost(host)
    ));

    return {
      company,
      role,
      appliedDate: today,
      channel: inferChannel(host),
      jobLink: location.href,
      statusLink: location.href,
      status: "已投递",
      statusUpdatedDate: today,
      notes: ""
    };
  }

  function parseApplicationCards(context) {
    const lines = context.lines;
    if (!hasApplicationCardMarkers(context.visibleText)) {
      return [];
    }

    const mokahrCandidates = parseMokahrApplicationCards(context);
    if (mokahrCandidates.length > 0) {
      return mokahrCandidates;
    }

    const hotjobCandidates = parseHotjobApplicationCards(context);
    if (hotjobCandidates.length > 0) {
      return hotjobCandidates;
    }

    const preferenceCandidates = parsePreferenceApplicationCards(context);
    if (preferenceCandidates.length > 0) {
      return preferenceCandidates;
    }

    const simpleCandidates = parseSimpleApplicationCards(context);
    if (simpleCandidates.length > 0) {
      return simpleCandidates;
    }

    const roleRows = lines.map((line, index) => ({
      index,
      roleData: extractRoleFromApplicationLine(line)
    })).filter((row) => row.roleData);

    const candidates = [];
    const seen = new Set();
    roleRows.forEach((row, rowIndex) => {
      const nextRoleIndex = roleRows[rowIndex + 1] ? roleRows[rowIndex + 1].index : lines.length;
      const cardLines = lines.slice(row.index, nextRoleIndex);
      const channelLead = lines[row.index - 1] && /校招|校园招聘|社招|社会招聘|留学生招聘/.test(lines[row.index - 1])
        ? [lines[row.index - 1]]
        : [];
      const scopedLines = channelLead.concat(cardLines);
      const cardText = scopedLines.join("\n");
      const appliedDate = extractAppliedDate(cardText) || context.today;
      const company = sanitizeCompanyName(firstNonEmpty(
        inferCompanyFromVisibleText(lines),
        inferCompanyFromTitle(context.titleText),
        inferCompanyFromHost(context.host)
      ));
      const channel = inferChannelFromLines(scopedLines) || inferChannelFromLines(lines) || inferChannel(context.host);
      const statusText = extractApplicationStatusText(cardText);
      const detailLine = extractApplicationDetailLine(cardLines, row.roleData.rawLine);
      const status = inferApplicationStatus(statusText || cardText);
      const notes = buildApplicationNotes({
        jobId: row.roleData.jobId,
        statusText,
        detailLine
      });
      const key = [company, row.roleData.role, appliedDate, row.roleData.jobId].join("|");
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push({
        company,
        role: row.roleData.role,
        appliedDate,
        channel,
        jobLink: location.href,
        statusLink: location.href,
        status,
        statusUpdatedDate: appliedDate,
        notes
      });
    });

    if (candidates.length > 0) {
      return candidates;
    }

    const timedCandidates = parseTimedDeliveryCards(context);
    if (timedCandidates.length > 0) {
      return timedCandidates;
    }

    return [];
  }

  function hasApplicationCardMarkers(text) {
    return /投递时间[:：]/.test(text)
      || /进入面试环节|修改简历|个人中心|我的申请|我的投递|第一意向|已完成的投递|投递记录|项目：|校园招聘 \||第\s*\d+\s*志愿|第 1 志愿|投递简历|最近投递|投递成功/.test(text);
  }

  function parseMokahrApplicationCards(context) {
    const lines = context.lines;
    if (!isMokahrHost(context.host) || !/投递记录/.test(context.visibleText) || !/项目[:：]/.test(context.visibleText)) {
      return [];
    }

    const roleRows = lines.map((line, index) => extractMokahrApplicationRoleRow(lines, index)).filter(Boolean);
    const candidates = [];
    const seen = new Set();
    roleRows.forEach((row, rowIndex) => {
      const nextRoleIndex = roleRows[rowIndex + 1] ? roleRows[rowIndex + 1].index : lines.length;
      const cardLines = lines.slice(row.index, nextRoleIndex);
      const cardText = cardLines.join("\n");
      const appliedDate = extractAppliedDate(cardText) || extractStandaloneDate(cardText) || context.today;
      const company = sanitizeCompanyName(firstNonEmpty(
        inferCompanyFromTitle(context.titleText),
        inferCompanyFromVisibleText(lines),
        inferCompanyFromHost(context.host)
      ));
      const statusText = extractMokahrStatusText(cardLines);
      const key = [company, row.role, appliedDate].join("|");
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push({
        company,
        role: row.role,
        appliedDate,
        channel: inferChannelFromLines(cardLines) || inferChannel(context.host),
        jobLink: location.href,
        statusLink: location.href,
        status: inferApplicationStatus(statusText || cardText),
        statusUpdatedDate: appliedDate,
        notes: ""
      });
    });

    return candidates;
  }

  function isMokahrHost(host) {
    return host === "app.mokahr.com" || host.endsWith(".mokahr.com");
  }

  function extractMokahrApplicationRoleRow(lines, index) {
    const role = cleanText(lines[index]);
    if (!isPlausibleMokahrApplicationRole(role) || !/^项目[:：]/.test(cleanText(lines[index + 1]))) {
      return null;
    }
    return {
      index,
      role
    };
  }

  function isPlausibleMokahrApplicationRole(line) {
    const value = cleanText(line);
    if (!value || !/[\u4e00-\u9fa5]/.test(value)) {
      return false;
    }
    if (/返回|我的简历|投递记录|个人资料|修改申请|撤回|简历初筛|业务复筛|面试安排|Offer沟通|录用|Powered by|Moka|项目[:：]/i.test(value)) {
      return false;
    }
    if (/^\d{1,2}:\d{2}$/.test(value)) {
      return false;
    }
    return true;
  }

  function extractMokahrStatusText(lines) {
    return lines.find((line) => /简历初筛|业务复筛|面试安排|Offer沟通|录用|筛选|面试|Offer|未通过|已拒绝/.test(line)) || "";
  }

  function parseHotjobApplicationCards(context) {
    const lines = context.lines;
    if (!context.host.endsWith(".hotjob.cn") || !/我的投递|最近投递|投递成功/.test(context.visibleText)) {
      return [];
    }

    const roleRows = lines.map((line, index) => extractHotjobApplicationRoleRow(lines, index)).filter(Boolean);
    const candidates = [];
    const seen = new Set();
    roleRows.forEach((row, rowIndex) => {
      const nextRoleIndex = roleRows[rowIndex + 1] ? roleRows[rowIndex + 1].index : lines.length;
      const cardLines = lines.slice(row.index, nextRoleIndex);
      const cardText = cardLines.join("\n");
      const appliedDate = extractAppliedDate(cardText) || extractStandaloneDate(cardText) || context.today;
      const company = sanitizeCompanyName(firstNonEmpty(
        inferCompanyFromVisibleText(lines),
        inferCompanyFromTitle(context.titleText),
        inferCompanyFromHotjobTenant(context.host),
        inferCompanyFromHost(context.host)
      ));
      const channel = inferChannelFromLines(cardLines) || inferChannelFromLines(lines) || inferChannel(context.host);
      const statusText = extractApplicationStatusText(cardText);
      const key = [company, row.role, appliedDate].join("|");
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push({
        company,
        role: row.role,
        appliedDate,
        channel,
        jobLink: location.href,
        statusLink: location.href,
        status: inferApplicationStatus(statusText || cardText),
        statusUpdatedDate: appliedDate,
        notes: ""
      });
    });

    return candidates;
  }

  function extractHotjobApplicationRoleRow(lines, index) {
    const role = normalizeHotjobApplicationRole(lines[index], lines[index + 1]);
    if (!role) {
      return null;
    }
    return {
      index,
      role
    };
  }

  function normalizeHotjobApplicationRole(line, nextLine) {
    let value = cleanText(line).replace(/^最近投递[:：]\s*/, "");
    const nextValue = cleanText(nextLine);
    if (/^[（(]\s*[A-Za-z]?\d{3,}\s*[）)]$/.test(nextValue) && !/[（(]\s*[A-Za-z]?\d{3,}\s*[）)]/.test(value)) {
      value = `${value}${nextValue}`;
    }
    const roleMatch = value.match(/(.+?[（(]\s*[A-Za-z]?\d{3,}\s*[）)])/);
    if (!roleMatch) {
      return "";
    }
    const role = cleanText(roleMatch[1]).replace(/\s+([（(])/g, "$1");
    if (!/[\u4e00-\u9fa5]/.test(role)) {
      return "";
    }
    if (/首页|个人中心|我的投递|我的收藏|简历管理|招聘官网|投递成功|导出简历|最近投递进度|已投递过的职位数/.test(role)) {
      return "";
    }
    return role;
  }

  function parseTimedDeliveryCards(context) {
    const lines = context.lines;
    if (!/投递时间：|投递时间[:：]|\d{4}-\d{1,2}-\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\s*投递/.test(context.visibleText)) {
      return [];
    }

    const roleRows = lines.map((line, index) => extractTimedDeliveryRoleRow(lines, index)).filter(Boolean);
    const candidates = [];
    const seen = new Set();
    roleRows.forEach((row) => {
      const company = sanitizeCompanyName(firstNonEmpty(
        inferCompanyFromVisibleText(lines),
        inferCompanyFromTitle(context.titleText),
        inferCompanyFromHost(context.host)
      ));
      const channel = inferTimedDeliveryChannel(row.cardLines) || inferChannelFromLines(row.cardLines) || inferChannel(context.host);
      const statusText = extractTimedDeliveryStatusText(row.cardLines);
      const notes = buildApplicationNotes({
        statusText,
        detailLine: row.detailLine,
        locationLine: row.locationLine,
        fullAppliedTime: row.delivery.full
      });
      const key = [company, row.role, row.delivery.full].join("|");
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push({
        company,
        role: row.role,
        appliedDate: row.delivery.date,
        channel,
        jobLink: location.href,
        statusLink: location.href,
        status: inferApplicationStatus(statusText || row.cardText),
        statusUpdatedDate: row.delivery.date,
        notes
      });
    });

    return candidates;
  }

  function extractTimedDeliveryRoleRow(lines, index) {
    const role = cleanText(lines[index]);
    if (!isPlausibleTimedDeliveryRole(role)) {
      return null;
    }

    const inlineDetail = cleanText(lines[index + 1]);
    const inlineDelivery = extractDeliveryDateTime(inlineDetail);
    if (inlineDelivery) {
      return {
        role,
        detailLine: inlineDetail,
        locationLine: "",
        delivery: inlineDelivery,
        cardLines: [role, inlineDetail],
        cardText: [role, inlineDetail].join("\n")
      };
    }

    const cardLines = lines.slice(index, Math.min(lines.length, index + 6));
    const deliveryLine = cardLines.find((line) => extractDeliveryDateTime(line));
    const delivery = extractDeliveryDateTime(deliveryLine || "");
    if (!delivery) {
      return null;
    }

    const detailLine = cardLines.find((line) => line !== role && line !== deliveryLine && (line.includes("|") || /招聘|职位|岗位/.test(line))) || "";
    const locationLine = cardLines.find((line) => line !== role && line !== deliveryLine && /省|市|区|县|广东|深圳|北京|上海|武汉|成都|杭州|南京|广州/.test(line)) || "";
    return {
      role,
      detailLine,
      locationLine,
      delivery,
      cardLines,
      cardText: cardLines.join("\n")
    };
  }

  function extractDeliveryDateTime(text) {
    const value = String(text || "");
    const explicit = value.match(/投递时间[:：]\s*(\d{4}-\d{1,2}-\d{1,2})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?/);
    if (explicit) {
      const date = normalizeDate(explicit[1]);
      return {
        date,
        full: cleanText([date, explicit[2] || ""].join(" "))
      };
    }

    const inline = value.match(/(\d{4}-\d{1,2}-\d{1,2})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?\s*投递/);
    if (inline) {
      const date = normalizeDate(inline[1]);
      return {
        date,
        full: cleanText([date, inline[2] || ""].join(" "))
      };
    }
    return null;
  }

  function isPlausibleTimedDeliveryRole(line) {
    const value = cleanText(line);
    if (!value) {
      return false;
    }
    if (!/[\u4e00-\u9fa5]/.test(value)) {
      return false;
    }
    if (/首页|投递记录|已完成的投递|已经投递|个职位|查看\/打印|没有更多|您好|星期|跟进应聘|简历评估|投递时间|校园招聘|社会招聘/.test(value)) {
      return false;
    }
    if (/^(?:北京|上海|天津|重庆|广东|深圳|广州|杭州|南京|武汉|成都|苏州|西安|长沙|青岛|厦门|中国)(?:\s+|$)/.test(value) || /^[\u4e00-\u9fa5]{2,}(?:省|市|区|县)\s*[\u4e00-\u9fa5]{0,8}(?:市|区|县)?$/.test(value)) {
      return false;
    }
    if (/^[A-Z0-9]{2,}\s+[\u4e00-\u9fa5]{2,12}$/.test(value)) {
      return false;
    }
    if (value.includes("|") || /^\d{4}-\d{1,2}-\d{1,2}/.test(value)) {
      return false;
    }
    return true;
  }

  function inferTimedDeliveryChannel(lines) {
    const text = lines.join("\n");
    if (text.includes("校园招聘 |")) return "校园招聘";
    if (/校园招聘|校招/.test(text)) return "校园招聘";
    if (/社会招聘|社招/.test(text)) return "社会招聘";
    return "";
  }

  function extractTimedDeliveryStatusText(lines) {
    return lines.find((line) => /简历评估|简历筛选|已投递|已查看|测评|笔试|面试|Offer|已拒绝|已挂|未通过/.test(line)) || "";
  }

  function parseSimpleApplicationCards(context) {
    const lines = context.lines;
    if (!/我的申请/.test(context.visibleText) || !/第一意向|第二意向|第[一二三四五六七八九十\d]+\s*意向/.test(context.visibleText)) {
      return [];
    }

    const simpleRows = lines.map((line, index) => extractSimpleApplicationRoleRow(lines, index)).filter(Boolean);
    const candidates = [];
    const seen = new Set();
    simpleRows.forEach((row) => {
      const cardLines = [row.role, row.detailLine];
      const company = sanitizeCompanyName(firstNonEmpty(
        inferCompanyFromVisibleText(lines),
        inferCompanyFromTitle(context.titleText),
        inferCompanyFromHost(context.host)
      ));
      const channel = inferChannelFromLines(cardLines) || inferChannel(context.host);
      const notes = buildApplicationNotes({
        detailLine: row.detailLine,
        missingAppliedDate: true
      });
      const key = [company, row.role, row.detailLine].join("|");
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push({
        company,
        role: row.role,
        appliedDate: context.today,
        channel,
        jobLink: location.href,
        statusLink: location.href,
        status: "已投递",
        statusUpdatedDate: context.today,
        notes
      });
    });

    return candidates;
  }

  function extractSimpleApplicationRoleRow(lines, index) {
    const role = cleanText(lines[index]);
    const detailLine = cleanText(lines[index + 1]);
    if (!isPlausibleSimpleApplicationRole(role) || !isSimpleApplicationDetailLine(detailLine)) {
      return null;
    }

    return {
      role,
      detailLine,
      roleIndex: index
    };
  }

  function isSimpleApplicationDetailLine(line) {
    return /(?:校招|校园招聘|社招|社会招聘)职位\s*\|\s*(?:第?[一二三四五六七八九十\d]+\s*意向|第一意向|第二意向)/.test(cleanText(line));
  }

  function isPlausibleSimpleApplicationRole(line) {
    const value = cleanText(line);
    if (!value) {
      return false;
    }
    if (/首页|社会招聘|校园招聘|个人中心|个人信息|社招简历|校招简历|我的申请|招聘会|你好|邮箱|微信/.test(value)) {
      return false;
    }
    if (value.includes("|") || /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
      return false;
    }
    return true;
  }

  function parsePreferenceApplicationCards(context) {
    const lines = context.lines;
    if (!/第\s*\d+\s*志愿|第 1 志愿/.test(context.visibleText) || !/投递简历|官网投递/.test(context.visibleText)) {
      return [];
    }

    const preferenceRows = lines.map((line, index) => extractPreferenceApplicationRow(lines, index)).filter(Boolean);
    const candidates = [];
    const seen = new Set();
    preferenceRows.forEach((row, rowIndex) => {
      const nextRoleIndex = preferenceRows[rowIndex + 1] ? preferenceRows[rowIndex + 1].roleIndex : lines.length;
      const cardLines = lines.slice(row.roleIndex, nextRoleIndex);
      const cardText = cardLines.join("\n");
      const appliedDate = extractPreferenceAppliedDate(cardText) || context.today;
      const company = sanitizeCompanyName(firstNonEmpty(
        inferCompanyFromVisibleText(lines),
        inferCompanyFromTitle(context.titleText),
        inferCompanyFromHost(context.host)
      ));
      const channel = inferPreferenceChannel(cardLines) || inferChannelFromLines(cardLines) || inferChannel(context.host);
      const statusText = extractPreferenceStatusText(cardLines);
      const detailLine = extractApplicationDetailLine(cardLines, row.role);
      const notes = buildApplicationNotes({
        preference: row.preference,
        statusText,
        detailLine
      });
      const key = [company, row.role, appliedDate, row.preference].join("|");
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push({
        company,
        role: row.role,
        appliedDate,
        channel,
        jobLink: location.href,
        statusLink: location.href,
        status: inferApplicationStatus(statusText || cardText),
        statusUpdatedDate: appliedDate,
        notes
      });
    });

    return candidates;
  }

  function extractPreferenceApplicationRow(lines, index) {
    const line = cleanText(lines[index]);
    const match = line.match(/第\s*(\d+)\s*志愿/);
    if (!match) {
      return null;
    }

    const inlineRole = cleanText(line.slice(0, match.index));
    const previousRole = inlineRole ? null : findPreviousPreferenceRoleLine(lines, index);
    const role = inlineRole || (previousRole ? previousRole.role : "");
    const roleIndex = inlineRole ? index : (previousRole ? previousRole.index : index);
    if (!isPlausiblePreferenceRole(role)) {
      return null;
    }

    return {
      role,
      roleIndex,
      markerIndex: index,
      preference: `第 ${match[1]} 志愿`
    };
  }

  function findPreviousPreferenceRoleLine(lines, index) {
    for (let i = index - 1; i >= Math.max(0, index - 5); i -= 1) {
      const candidate = cleanText(lines[i]);
      if (isPlausiblePreferenceRole(candidate)) {
        return {
          role: candidate,
          index: i
        };
      }
    }
    return null;
  }

  function isPlausiblePreferenceRole(line) {
    const value = cleanText(line);
    if (!value) {
      return false;
    }
    if (/首页|职位|产品官网|招聘官网|应聘记录|修改志愿顺序|官网投递|投递简历|第\s*\d+\s*志愿/.test(value)) {
      return false;
    }
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(value) || value.includes("|") || /意向城市/.test(value)) {
      return false;
    }
    return true;
  }

  function extractPreferenceAppliedDate(text) {
    return extractAppliedDate(text) || extractStandaloneDate(text);
  }

  function extractStandaloneDate(text) {
    const match = String(text || "").match(/(?:^|\n)\s*(\d{4}-\d{1,2}-\d{1,2})\s*(?=\n|$)/);
    return match ? normalizeDate(match[1]) : "";
  }

  function inferPreferenceChannel(lines) {
    const text = lines.join("\n");
    if (/官网投递/.test(text)) return "官网投递";
    if (/内推/.test(text)) return "内推";
    return "";
  }

  function extractPreferenceStatusText(lines) {
    const statusLine = lines.find((line) => /官网投递|投递简历|已投递|已查看|进入面试环节|面试|测评|笔试|Offer|已拒绝|未通过/.test(line));
    return statusLine || "";
  }

  function extractRoleFromApplicationLine(line) {
    const cleaned = cleanText(line).replace(/^(校招|社招|社会招聘|留学生招聘)\s+/, "");
    const match = cleaned.match(/[（(]\s*(\d{4,})\s*[）)]\s*$/);
    if (!match) {
      return null;
    }
    const role = cleanText(cleaned.slice(0, match.index));
    if (!role || /^(首页|个人中心|校园招聘|社会招聘|留学生招聘|关于我们)$/.test(role)) {
      return null;
    }
    return {
      role,
      jobId: match[1],
      rawLine: cleaned
    };
  }

  function extractAppliedDate(text) {
    const match = String(text || "").match(/投递时间[:：]\s*(\d{4}-\d{1,2}-\d{1,2})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/);
    return match ? normalizeDate(match[1]) : "";
  }

  function extractApplicationStatusText(text) {
    const lines = String(text || "").split(/\n+/).map(cleanText).filter(Boolean);
    const statusLine = lines.find((line) => /进入面试环节|面试环节|已拒绝|未通过|不合适|已查看|筛选|测评|笔试|Offer|录用|放弃|撤销/.test(line));
    return statusLine || "";
  }

  function extractApplicationDetailLine(lines, roleLine) {
    return lines.find((line) => {
      if (line === roleLine || /投递时间[:：]/.test(line)) {
        return false;
      }
      return line.includes("|") || /硕士|博士|本科|研发类|技术类|职能类/.test(line);
    }) || "";
  }

  function inferApplicationStatus(text) {
    const value = cleanText(text);
    if (/已挂|挂了|未通过|不合适|淘汰/.test(value)) return "已挂";
    if (/已拒绝/.test(value)) return "已拒绝";
    if (/放弃|撤销|取消投递/.test(value)) return "已放弃";
    if (/Offer|录用/.test(value)) return "Offer 沟通中";
    if (/HR\s*面|人力/.test(value)) return "HR 面";
    if (/技术三面|三面/.test(value)) return "技术三面";
    if (/技术二面|二面/.test(value)) return "技术二面";
    if (/技术一面|一面|初面/.test(value)) return "技术一面";
    if (/进入面试环节|面试环节|面试/.test(value)) return "等待一面";
    if (/测评|笔试/.test(value)) return "测评 / 笔试";
    if (/简历评估|简历初筛|初筛|复筛|筛选|处理中/.test(value)) return "简历筛选中";
    if (/已查看/.test(value)) return "已查看";
    if (/官网投递|投递简历/.test(value)) return "已投递";
    return "已投递";
  }

  function inferChannelFromLines(lines) {
    const text = lines.join("\n");
    if (/留学生招聘/.test(text)) return "留学生招聘";
    if (/校招|校园招聘/.test(text)) return "校招";
    if (/社招|社会招聘/.test(text)) return "社招";
    return "";
  }

  function inferCompanyFromVisibleText(lines) {
    const blocked = /首页|个人中心|校园招聘|社会招聘|留学生招聘|关于我们|联系我们|投递时间|进入面试环节/;
    for (const line of lines.slice(0, 20)) {
      const candidate = cleanText(line.replace(/SINCE\s*\d{4}.*/i, "").replace(/[-—_]+/g, " "));
      if (candidate && /(集团|公司|银行|大学|医院|科技|股份|有限)/.test(candidate) && !blocked.test(candidate)) {
        return sanitizeCompanyName(candidate);
      }
    }
    for (let index = 0; index < Math.min(lines.length, 12); index += 1) {
      const candidate = cleanText(lines[index]);
      const nextLine = cleanText(lines[index + 1]);
      if (candidate && /^[\u4e00-\u9fa5]{2,12}$/.test(candidate) && /^[A-Z][A-Z0-9\s-]{2,}$/.test(nextLine) && !blocked.test(candidate)) {
        return sanitizeCompanyName(candidate);
      }
    }
    return "";
  }

  function buildApplicationNotes() {
    return "";
  }

  function readVisibleLines() {
    const bodyText = document.body ? (document.body.innerText || document.body.textContent || "") : "";
    return String(bodyText).split(/\n+/).map(cleanText).filter(Boolean);
  }

  function readJobPostingJsonLd() {
    const scripts = Array.from(document.querySelectorAll("script[type=\"application/ld+json\"]"));
    for (const script of scripts) {
      const parsed = safeJsonParse(script.textContent || "");
      const posting = findJobPosting(parsed);
      if (posting) {
        return posting;
      }
    }
    return {};
  }

  function findJobPosting(value) {
    if (!value) {
      return null;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findJobPosting(item);
        if (found) {
          return found;
        }
      }
      return null;
    }
    if (typeof value === "object") {
      const type = value["@type"];
      if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
        return value;
      }
      if (Array.isArray(value["@graph"])) {
        return findJobPosting(value["@graph"]);
      }
    }
    return null;
  }

  function getHiringOrganizationName(jsonLd) {
    const org = jsonLd.hiringOrganization;
    if (!org) {
      return "";
    }
    if (typeof org === "string") {
      return cleanText(org);
    }
    return cleanText(org.name || org.legalName || "");
  }

  function readMeta(selector) {
    const element = document.querySelector(selector);
    return cleanText(element ? element.getAttribute("content") : "");
  }

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function stripSiteName(text) {
    return cleanText(text.split(/\s[-|｜]\s/)[0]);
  }

  function inferCompanyFromTitle(text) {
    const parts = text.split(/\s[-|｜]\s/).map(cleanText).filter(Boolean);
    if (parts.length >= 2) {
      for (let index = parts.length - 1; index >= 0; index -= 1) {
        const candidate = sanitizeCompanyName(parts[index]);
        if (candidate && !isGenericRecruitingTitlePart(candidate)) {
          return candidate;
        }
      }
    }
    const cleaned = sanitizeCompanyName(text);
    const knownBrand = cleaned.match(/^(DJI\s*大疆|大疆|新凯来|三环集团|拓竹科技)/i);
    if (knownBrand) {
      return sanitizeCompanyName(knownBrand[1]);
    }
    const companyMatch = cleaned.match(/^(.+?(?:集团|股份有限公司|有限公司|公司|科技|银行|大学|医院))(?:\s+\d+届.*)?(?:招聘|校园招聘|社会招聘)?$/);
    if (companyMatch) {
      return sanitizeCompanyName(companyMatch[1]);
    }
    return "";
  }

  function isGenericRecruitingTitlePart(value) {
    const cleaned = sanitizeCompanyName(value);
    return /^(校园|社会|校招|社招|招聘|职位|申请职位|人才招聘|校园招聘|社会招聘|招聘官网|招聘门户|加入我们|Moka)$/i.test(cleaned);
  }

  function inferCompanyFromHost(host) {
    const known = {
      "linkedin.com": "LinkedIn",
      "jobs.lever.co": "Lever",
      "boards.greenhouse.io": "Greenhouse",
      "wantedly.com": "Wantedly",
      "indeed.com": "Indeed",
      "glassdoor.com": "Glassdoor",
      "xmcwh.com": "新芯股份"
    };
    if (known[host]) {
      return known[host];
    }
    const zhiyeTenant = inferCompanyFromZhiyeTenant(host);
    if (zhiyeTenant) {
      return zhiyeTenant;
    }
    const hotjobTenant = inferCompanyFromHotjobTenant(host);
    if (hotjobTenant) {
      return hotjobTenant;
    }
    const parts = host.split(".");
    const candidate = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    return cleanText(candidate.replace(/[-_]/g, " ")).replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function inferCompanyFromZhiyeTenant(host) {
    if (!host.endsWith(".zhiye.com")) {
      return "";
    }
    const tenant = host.split(".")[0];
    const knownTenants = {
      "whxmc": "新芯股份",
      "yofc2": "长飞光纤"
    };
    return knownTenants[tenant] || "";
  }

  function inferCompanyFromHotjobTenant(host) {
    if (!host.endsWith(".hotjob.cn")) {
      return "";
    }
    const tenant = host.split(".")[0];
    const knownTenants = {
      "goertek": "Goertek"
    };
    return knownTenants[tenant] || "";
  }

  function inferChannel(host) {
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("wantedly")) return "Wantedly";
    if (host.includes("indeed")) return "Indeed";
    if (host.includes("greenhouse")) return "Greenhouse";
    if (host.includes("lever.co")) return "Lever";
    if (host.includes("workday")) return "Workday";
    return "公司官网";
  }

  function firstNonEmpty() {
    for (const value of arguments) {
      const cleaned = cleanText(value);
      if (cleaned) {
        return cleaned;
      }
    }
    return "";
  }

  function sanitizeCompanyName(value) {
    return cleanText(value)
      .replace(/^欢迎加入/, "")
      .replace(/^欢迎来到/, "")
      .replace(/^加入/, "")
      .replace(/\s+\d+届.*招聘$/, "")
      .replace(/招聘$/, "")
      .replace(/招聘官网$/, "")
      .trim();
  }

  function normalizeDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) {
      return "";
    }
    return [
      match[1],
      match[2].padStart(2, "0"),
      match[3].padStart(2, "0")
    ].join("-");
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  globalThis.JobTrackerParser = {
    parseJobPage
  };
})();
