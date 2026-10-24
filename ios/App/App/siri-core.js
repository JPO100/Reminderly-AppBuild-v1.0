var ReminderlySiri = (function(exports) {
  "use strict";
  const ALL_RECOGNITION_ENABLED = { date: true, time: true, repeats: true };
  const WEEKDAY = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)";
  const WEEKDAY_SHORT = "(?:mon|tue|wed|thu|thur|fri|sat|sun)";
  const MONTH_NAME_TO_NUMBER = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12
  };
  const MONTH_NAMES = "(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)";
  const LEADING_WEEKDAY = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat|sun)";
  const YEARLESS_NUMERIC_LEAD = /\b(?:on|by|before|until|from|due|for)\s+$/i;
  function fullYear(value) {
    const year = parseInt(value.replace(/^'/, ""), 10);
    return value.replace(/^'/, "").length === 2 ? 2e3 + year : year;
  }
  const NUMBER_WORD_TO_NUMBER = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12
  };
  const NUMBER_WORDS = "(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";
  function spokenNumber(value) {
    const lower = value.toLowerCase();
    if (lower === "a" || lower === "an") return 1;
    if (/^\d+$/.test(lower)) return parseInt(lower, 10);
    return NUMBER_WORD_TO_NUMBER[lower] ?? null;
  }
  const RELATIVE_AMOUNT = `(\\d{1,2}|${NUMBER_WORDS}|an?)`;
  const RELATIVE_TIME_REGEX = new RegExp(`\\bin\\s+${RELATIVE_AMOUNT}\\s+(minutes?|mins?|hours?|hrs?)\\b`, "gi");
  const RELATIVE_DAYS_REGEX = new RegExp(`\\bin\\s+${RELATIVE_AMOUNT}\\s+days?\\b`, "gi");
  const CLOCK_HOUR = `(\\d{1,2}|${NUMBER_WORDS})`;
  const SPOKEN_CLOCK_REGEX = new RegExp(
    `\\b(?:(half|quarter)\\s+(past|to)\\s+${CLOCK_HOUR}|${CLOCK_HOUR}\\s+o['’]?\\s?clock)(?:\\s*(am|pm)\\b)?`,
    "gi"
  );
  const WORD_AM_PM_REGEX = new RegExp(`\\b${NUMBER_WORDS}\\s*(?:am|pm)\\b`, "gi");
  function isRelativeAmount(value) {
    const amount = spokenNumber(value);
    return amount !== null && amount >= 1 && amount <= 99;
  }
  function findUnsupportedClockTime(text) {
    const patterns = [
      { regex: /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/gi, is24Hour: false },
      { regex: /\b([01]?\d|2[0-3]):([0-5]\d)\b/g, is24Hour: true }
    ];
    for (const { regex, is24Hour } of patterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        if (!is24Hour && (hour < 1 || hour > 12)) continue;
        if (minute > 59 || [0, 15, 30, 45].includes(minute)) continue;
        if (!is24Hour) {
          const period = match[3].toLowerCase();
          if (period === "pm" && hour !== 12) hour += 12;
          if (period === "am" && hour === 12) hour = 0;
        }
        return { text: match[0], hour, minute, is24Hour };
      }
    }
    return null;
  }
  function isValidMonthDay(month, day, year) {
    if (day < 1) return false;
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  }
  function parseTokens(text, recognition = ALL_RECOGNITION_ENABLED) {
    const candidates = [];
    const timeOfDayCandidates = [];
    const collect = (regex, category, validate) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (validate && !validate(match)) continue;
        candidates.push({
          category,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
      }
    };
    const collectTimeOfDay = (regex, validate) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        timeOfDayCandidates.push({
          category: "time",
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
      }
    };
    if (!recognition.repeats) ;
    else {
      collect(/\bevery\s+(?:morning|afternoon|evening|night)\b/gi, "repeats");
      collect(new RegExp(`\\bevery\\s+${WEEKDAY}\\b`, "gi"), "repeats");
      collect(/\bevery\s+(?:day|week|month|year|hour)\b/gi, "repeats");
      collect(/\bevery\s+\d+\s+(?:days?|weeks?|months?|hours?)\b/gi, "repeats");
      collect(/\bweekdays\b/gi, "repeats");
      collect(/\b(?:daily|weekly|monthly|yearly|hourly)\b/gi, "repeats");
      const commaListRegex = new RegExp(
        `\\b${WEEKDAY_SHORT}(?:\\s*,\\s*${WEEKDAY_SHORT})+\\b`,
        "gi"
      );
      collect(commaListRegex, "repeats");
    }
    if (!recognition.date) ;
    else {
      collect(/\b(?:today|tomorrow)\b/gi, "date");
      collect(new RegExp(`\\bnext\\s+${WEEKDAY}\\b`, "gi"), "date");
      collect(/\b(?:the\s+)?day\s+after\s+tomorrow\b/gi, "date");
      collect(RELATIVE_DAYS_REGEX, "date", (match) => isRelativeAmount(match[1]));
      collect(new RegExp(`\\b${WEEKDAY}\\b`, "gi"), "date");
      const absoluteDates = [];
      const pushAbsolute = (start, end) => {
        const token = { category: "date", start, end, text: text.slice(start, end) };
        candidates.push(token);
        absoluteDates.push(token);
      };
      const isRealDate = (day, month, year) => {
        if (month < 1 || month > 12 || day < 1 || day > 31) return false;
        if (year !== null) return isValidMonthDay(month, day, year);
        const thisYear = (/* @__PURE__ */ new Date()).getFullYear();
        return isValidMonthDay(month, day, thisYear) || isValidMonthDay(month, day, thisYear + 1);
      };
      const TWO_DIGIT_YEAR = `'?(\\d{2})(?![\\d:]|\\s*(?:am|pm)\\b)`;
      const collectMonthNameDates = (pattern, datePart, fields) => {
        const regex = new RegExp(pattern, "gi");
        let match;
        while ((match = regex.exec(text)) !== null) {
          const { day, month, fourDigit, twoDigit } = fields(match);
          const year = fourDigit ? parseInt(fourDigit, 10) : twoDigit ? 2e3 + parseInt(twoDigit, 10) : null;
          const yearOk = year !== null && isRealDate(day, month, year) && (!!fourDigit || year >= (/* @__PURE__ */ new Date()).getFullYear());
          if (yearOk) pushAbsolute(match.index, match.index + match[0].length);
          else if (isRealDate(day, month, null)) pushAbsolute(match.index, match.index + datePart.exec(match[0])[0].length);
        }
      };
      collectMonthNameDates(
        `\\b(${MONTH_NAMES})\\s+(\\d{1,2})(st|nd|rd|th)?(?:\\s+(?:(\\d{4})|${TWO_DIGIT_YEAR}))?\\b`,
        new RegExp(`^${MONTH_NAMES}\\s+\\d{1,2}(?:st|nd|rd|th)?`, "i"),
        (m) => ({
          day: parseInt(m[2], 10),
          month: MONTH_NAME_TO_NUMBER[m[1].toLowerCase()],
          fourDigit: m[4],
          twoDigit: m[5] && (m[3] || m[0].includes("'")) ? m[5] : void 0
        })
      );
      collectMonthNameDates(
        `\\b(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_NAMES})(?:\\s+(?:(\\d{4})|${TWO_DIGIT_YEAR}))?\\b`,
        new RegExp(`^(?:the\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_NAMES}`, "i"),
        (m) => ({ day: parseInt(m[1], 10), month: MONTH_NAME_TO_NUMBER[m[2].toLowerCase()], fourDigit: m[3], twoDigit: m[4] })
      );
      {
        const regex = /(^|[\s(])(\d{1,2})([/.-])(\d{1,2})(?:\3(\d{4}|\d{2}))?(?=$|[\s,;!?)]|\.(?:\s|$))/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          const start = match.index + match[1].length;
          const day = parseInt(match[2], 10);
          const month = parseInt(match[4], 10);
          const year = match[5] ? fullYear(match[5]) : null;
          if (year === null && (match[3] !== "/" || !YEARLESS_NUMERIC_LEAD.test(text.slice(0, start)))) continue;
          if (!isRealDate(day, month, year)) continue;
          pushAbsolute(start, match.index + match[0].length);
        }
        const iso = /(^|[\s(])(\d{4})-(\d{2})-(\d{2})(?=$|[\s,;!?)]|\.(?:\s|$))/g;
        while ((match = iso.exec(text)) !== null) {
          if (!isRealDate(parseInt(match[4], 10), parseInt(match[3], 10), parseInt(match[2], 10))) continue;
          pushAbsolute(match.index + match[1].length, match.index + match[0].length);
        }
      }
      for (const date of absoluteDates) {
        const lead = new RegExp(`\\b${LEADING_WEEKDAY}\\s*,?\\s+$`, "i").exec(text.slice(0, date.start));
        if (lead) {
          candidates.push({ category: "date", start: lead.index, end: date.end, text: text.slice(lead.index, date.end) });
        }
      }
    }
    if (!recognition.time) ;
    else {
      collect(
        /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi,
        "time",
        (match) => {
          const hour = parseInt(match[1], 10);
          if (hour < 1 || hour > 12) return false;
          if (match[2]) {
            const min = parseInt(match[2], 10);
            if (![0, 15, 30, 45].includes(min)) return false;
          }
          return true;
        }
      );
      collect(
        /\b([01]?\d|2[0-3]):([0-5]\d)\b/g,
        "time",
        (match) => {
          const hour = parseInt(match[1], 10);
          const min = parseInt(match[2], 10);
          if (hour < 0 || hour > 23) return false;
          if (![0, 15, 30, 45].includes(min)) return false;
          return true;
        }
      );
      collect(RELATIVE_TIME_REGEX, "time", (match) => isRelativeAmount(match[1]));
      collect(SPOKEN_CLOCK_REGEX, "time", (match) => {
        const hour = spokenNumber(match[3] ?? match[4]);
        return hour !== null && hour >= 1 && hour <= 12;
      });
      collect(WORD_AM_PM_REGEX, "time");
      collectTimeOfDay(/\bthis\s+(?:morning|afternoon|evening)\b/gi);
      collectTimeOfDay(/\btonight\b/gi);
      collectTimeOfDay(/\b(?:morning|lunchtime|noon|afternoon|evening|night)\b/gi);
      const hasExplicitTime = candidates.some((c) => c.category === "time");
      if (!hasExplicitTime) {
        candidates.push(...timeOfDayCandidates);
      }
    }
    const hasRepeatToken = candidates.some((c) => c.category === "repeats");
    const finalCandidates = hasRepeatToken ? candidates.filter((c) => c.category !== "date") : candidates;
    finalCandidates.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
    const result = [];
    let lastEnd = 0;
    for (const token of finalCandidates) {
      if (token.start >= lastEnd) {
        result.push(token);
        lastEnd = token.end;
      }
    }
    return result;
  }
  const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const FULL_DAY_TO_JS_INDEX = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  const SHORT_DAY_TO_FULL = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday"
  };
  const TIME_OF_DAY_MAP = {
    "morning": { hour: 7, minute: 0 },
    "lunchtime": { hour: 12, minute: 0 },
    "noon": { hour: 12, minute: 0 },
    "afternoon": { hour: 15, minute: 0 },
    "evening": { hour: 18, minute: 0 },
    "night": { hour: 21, minute: 0 },
    "this morning": { hour: 7, minute: 0 },
    "this afternoon": { hour: 15, minute: 0 },
    "this evening": { hour: 18, minute: 0 },
    "tonight": { hour: 21, minute: 0 }
  };
  const COMPOUND_TIME_TOKENS = /* @__PURE__ */ new Set(["this morning", "this afternoon", "this evening", "tonight"]);
  function isCompoundTimeToken(tokenText) {
    const normalised = tokenText.toLowerCase().trim().replace(/\s+/g, " ");
    return COMPOUND_TIME_TOKENS.has(normalised);
  }
  const EVERY_TIME_OF_DAY_MAP = {
    "morning": { hour: 7, minute: 0 },
    "afternoon": { hour: 15, minute: 0 },
    "evening": { hour: 18, minute: 0 },
    "night": { hour: 21, minute: 0 }
  };
  function getNextDayOccurrence(from, dayIndices) {
    for (let offset = 0; offset <= 7; offset++) {
      const candidate = new Date(from);
      candidate.setDate(from.getDate() + offset);
      if (dayIndices.includes(candidate.getDay())) {
        return candidate;
      }
    }
    return new Date(from);
  }
  function resolveDayMonth(day, month, year, today) {
    let y = year ?? today.getFullYear();
    if (year === null && (month < today.getMonth() + 1 || month === today.getMonth() + 1 && day < today.getDate())) y += 1;
    const candidate = new Date(y, month - 1, day);
    if (candidate.getFullYear() !== y || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
    candidate.setHours(0, 0, 0, 0);
    return candidate;
  }
  function parseDateTokenValue(tokenText, now = /* @__PURE__ */ new Date()) {
    let lower = tokenText.toLowerCase().trim();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const withoutWeekday = lower.replace(new RegExp(`^${LEADING_WEEKDAY}\\s*,?\\s+(?=(?:the\\s+)?\\d|[a-z]+\\s+\\d)`), "");
    if (withoutWeekday !== lower && withoutWeekday !== "") lower = withoutWeekday;
    lower = lower.replace(/^the\s+/, "").replace(/\s+of\s+/, " ");
    const numeric = /^(\d{1,2})([/.-])(\d{1,2})(?:\2(\d{2}|\d{4}))?$/.exec(lower);
    if (numeric) {
      return resolveDayMonth(parseInt(numeric[1], 10), parseInt(numeric[3], 10), numeric[4] ? fullYear(numeric[4]) : null, today);
    }
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lower);
    if (iso) return resolveDayMonth(parseInt(iso[3], 10), parseInt(iso[2], 10), parseInt(iso[1], 10), today);
    if (lower === "today") return today;
    if (/^(?:the\s+)?day\s+after\s+tomorrow$/.test(lower)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      return d;
    }
    const inDays = /^in\s+(\S+)\s+days?$/.exec(lower);
    if (inDays) {
      const days = spokenNumber(inDays[1]);
      if (days === null) return null;
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d;
    }
    if (lower === "tomorrow") {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return d;
    }
    const monthDateMatch = /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+('?\d{2}|\d{4}))?$/i.exec(lower);
    if (monthDateMatch) {
      const monthNum = MONTH_NAME_TO_NUMBER[monthDateMatch[1]];
      if (monthNum !== void 0) {
        return resolveDayMonth(parseInt(monthDateMatch[2], 10), monthNum, monthDateMatch[3] ? fullYear(monthDateMatch[3]) : null, today);
      }
    }
    const dayMonthMatch = /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+('?\d{2}|\d{4}))?$/i.exec(lower);
    if (dayMonthMatch) {
      const monthNum = MONTH_NAME_TO_NUMBER[dayMonthMatch[2]];
      if (monthNum !== void 0) {
        return resolveDayMonth(parseInt(dayMonthMatch[1], 10), monthNum, dayMonthMatch[3] ? fullYear(dayMonthMatch[3]) : null, today);
      }
    }
    const hasNext = lower.startsWith("next ");
    const dayName = hasNext ? lower.slice(5).trim() : lower;
    const dayIndex = FULL_DAY_TO_JS_INDEX[dayName];
    if (dayIndex === void 0) return null;
    const todayDow = today.getDay();
    let daysAhead = dayIndex - todayDow;
    if (daysAhead <= 0) daysAhead += 7;
    if (hasNext && daysAhead < 7) daysAhead += 7;
    if (!hasNext) {
      daysAhead = dayIndex - todayDow;
      if (daysAhead < 0) daysAhead += 7;
    }
    const result = new Date(today);
    result.setDate(today.getDate() + daysAhead);
    return result;
  }
  const QUARTER_MS = 15 * 60 * 1e3;
  function roundToQuarterHour(target, now) {
    const rounded = new Date(target);
    const minutes = rounded.getMinutes() + rounded.getSeconds() / 60 + rounded.getMilliseconds() / 6e4;
    const quarter = Math.floor(minutes / 15);
    rounded.setMinutes(quarter * 15 + (minutes - quarter * 15 >= 7.5 ? 15 : 0), 0, 0);
    while (rounded.getTime() <= now.getTime()) rounded.setTime(rounded.getTime() + QUARTER_MS);
    return rounded;
  }
  function parseRelativeTimeValue(tokenText, now) {
    const match = /^in\s+(\S+)\s+(minutes?|mins?|hours?|hrs?)$/i.exec(tokenText.trim().replace(/\s+/g, " "));
    if (!match) return null;
    const amount = spokenNumber(match[1]);
    if (amount === null) return null;
    const unitMs = match[2].toLowerCase().startsWith("h") ? 60 * 60 * 1e3 : 60 * 1e3;
    const at = roundToQuarterHour(new Date(now.getTime() + amount * unitMs), now);
    const date = new Date(at);
    date.setHours(0, 0, 0, 0);
    return { date, time: { hour: at.getHours(), minute: at.getMinutes() } };
  }
  function parseTimeTokenValue(tokenText, now = /* @__PURE__ */ new Date(), dateGiven = false) {
    const lower = tokenText.toLowerCase().trim().replace(/\u2019/g, "'");
    const relative = parseRelativeTimeValue(lower, now);
    if (relative) return relative.time;
    const wordAmPm = /^([a-z]+)\s*(am|pm)$/.exec(lower);
    if (wordAmPm) {
      const word = spokenNumber(wordAmPm[1]);
      if (word === null) return null;
      return parseTimeTokenValue(`${word}${wordAmPm[2]}`, now, dateGiven);
    }
    const spoken = /^(?:(half|quarter)\s+(past|to)\s+(\S+)|(\S+)\s+o'?\s?clock)(?:\s*(am|pm))?$/.exec(lower);
    if (spoken) {
      const named = spokenNumber(spoken[3] ?? spoken[4]);
      if (named === null) return null;
      let hour = named % 12;
      let minute = 0;
      if (spoken[1] === "half") minute = 30;
      else if (spoken[1] === "quarter" && spoken[2] === "past") minute = 15;
      else if (spoken[1] === "quarter") {
        minute = 45;
        hour = (hour + 11) % 12;
      }
      if (spoken[5]) return { hour: spoken[5] === "pm" ? hour + 12 : hour, minute };
      if (dateGiven) return { hour: hour >= 7 ? hour : hour + 12, minute };
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const am = hour * 60 + minute;
      const pm = am + 12 * 60;
      const next = [am, pm].find((m) => m > nowMinutes) ?? am;
      return { hour: Math.floor(next / 60), minute: next % 60 };
    }
    const match12 = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/.exec(lower);
    if (match12) {
      let hour = parseInt(match12[1], 10);
      const minute = match12[2] ? parseInt(match12[2], 10) : 0;
      const period = match12[3];
      if (period === "pm" && hour !== 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;
      return { hour, minute };
    }
    const match24 = /^(\d{1,2}):(\d{2})$/.exec(lower);
    if (match24) {
      return { hour: parseInt(match24[1], 10), minute: parseInt(match24[2], 10) };
    }
    const normalised = lower.replace(/\s+/g, " ");
    const timeOfDay = TIME_OF_DAY_MAP[normalised];
    if (timeOfDay) {
      return timeOfDay;
    }
    return null;
  }
  function parseRepeatsTokenValue(tokenText) {
    const lower = tokenText.toLowerCase().trim();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const oneWordFrequency = {
      hourly: "hourly",
      daily: "daily",
      weekly: "weekly",
      monthly: "monthly",
      yearly: "yearly"
    };
    if (oneWordFrequency[lower]) {
      return { config: { frequency: oneWordFrequency[lower], interval: 1 }, anchorDate: new Date(today), impliedTime: null };
    }
    if (lower === "weekdays") {
      return {
        config: { frequency: "custom-days", interval: 5, selectedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
        anchorDate: getNextDayOccurrence(today, [1, 2, 3, 4, 5]),
        impliedTime: null
      };
    }
    const commaParts = lower.split(/\s*,\s*/);
    if (commaParts.length >= 2 && commaParts.every((p) => SHORT_DAY_TO_FULL[p] !== void 0)) {
      const selectedDays = commaParts.map((p) => SHORT_DAY_TO_FULL[p]);
      const dayIndices = selectedDays.map((d) => FULL_DAY_TO_JS_INDEX[d.toLowerCase()]).filter((d) => d !== void 0);
      return {
        config: { frequency: "custom-days", interval: selectedDays.length, selectedDays },
        anchorDate: getNextDayOccurrence(today, dayIndices),
        impliedTime: null
      };
    }
    const everyNMatch = /^every\s+(\d+)\s+(days?|weeks?|months?|hours?)$/.exec(lower);
    if (everyNMatch) {
      const n = parseInt(everyNMatch[1], 10);
      const unit = everyNMatch[2].replace(/s$/, "");
      const freqMap = {
        day: "daily",
        week: "weekly",
        month: "monthly",
        hour: "hourly"
      };
      const freq = freqMap[unit];
      if (freq) {
        return { config: { frequency: freq, interval: n }, anchorDate: new Date(today), impliedTime: null };
      }
    }
    const everyWordMatch = /^every\s+(\w+)$/.exec(lower);
    if (everyWordMatch) {
      const word = everyWordMatch[1];
      if (WEEKDAY_NAMES.includes(word)) {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
        const dayIndex = FULL_DAY_TO_JS_INDEX[word];
        return {
          config: { frequency: "custom-days", interval: 1, selectedDays: [capitalized] },
          anchorDate: getNextDayOccurrence(today, [dayIndex]),
          impliedTime: null
        };
      }
      const freqMap = {
        day: "daily",
        week: "weekly",
        month: "monthly",
        year: "yearly",
        hour: "hourly"
      };
      const freq = freqMap[word];
      if (freq) {
        return { config: { frequency: freq, interval: 1 }, anchorDate: new Date(today), impliedTime: null };
      }
      const impliedTime = EVERY_TIME_OF_DAY_MAP[word];
      if (impliedTime) {
        return {
          config: { frequency: "daily", interval: 1 },
          anchorDate: new Date(today),
          impliedTime
        };
      }
    }
    return null;
  }
  function computeTokenClickResult(token, now = /* @__PURE__ */ new Date(), dateGiven = false) {
    switch (token.category) {
      case "date": {
        const date = parseDateTokenValue(token.text, now);
        if (!date) return null;
        return {
          togglesOn: ["date"],
          dateValue: date,
          timeValue: null,
          repeatConfig: null
        };
      }
      case "time": {
        const relative = parseRelativeTimeValue(token.text, now);
        if (relative) {
          return {
            togglesOn: ["time", "date"],
            dateValue: relative.date,
            timeValue: relative.time,
            repeatConfig: null
          };
        }
        const time = parseTimeTokenValue(token.text, now, dateGiven);
        if (!time) return null;
        if (isCompoundTimeToken(token.text)) {
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          return {
            togglesOn: ["time", "date"],
            dateValue: today,
            timeValue: time,
            repeatConfig: null
          };
        }
        return {
          togglesOn: ["time"],
          dateValue: null,
          timeValue: time,
          repeatConfig: null
        };
      }
      case "repeats": {
        const result = parseRepeatsTokenValue(token.text);
        if (!result) return null;
        const togglesOn = ["repeats", "date"];
        if (result.impliedTime) {
          togglesOn.push("time");
        }
        return {
          togglesOn,
          dateValue: result.anchorDate,
          timeValue: result.impliedTime,
          repeatConfig: result.config
        };
      }
    }
  }
  function computeAutoApplyResult(parsedTokens, currentToggles) {
    const actions = [];
    const byCategory = { date: [], time: [], repeats: [] };
    for (const token of parsedTokens) {
      byCategory[token.category].push(token);
    }
    let repeatsApplying = false;
    if (byCategory.repeats.length === 1 && true && true) {
      actions.push({ category: "repeats", token: byCategory.repeats[0] });
      repeatsApplying = true;
    }
    if (byCategory.date.length === 1 && true && !repeatsApplying) {
      actions.push({ category: "date", token: byCategory.date[0] });
    }
    if (byCategory.time.length === 1 && true) {
      actions.push({ category: "time", token: byCategory.time[0] });
    }
    return actions;
  }
  const CONNECTOR_BEFORE = /\b(?:at|on|in)\s+$/i;
  const TOKEN_GAP = /^\s*,?\s*(?:(?:at|on|in)\s+)?$/i;
  function titleFromAppliedTokens(text, applied) {
    const tokens = applied.filter((t) => t.start >= 0 && t.end <= text.length && t.end > t.start).sort((a, b) => a.start - b.start);
    const removable = tokens.map((t) => CONNECTOR_BEFORE.test(text.slice(0, t.start)) || /^[\s,.;!?]*$/.test(text.slice(t.end)));
    let changed = true;
    while (changed) {
      changed = false;
      tokens.forEach((t, i) => {
        if (removable[i]) return;
        const joinsPrevious = i > 0 && removable[i - 1] && TOKEN_GAP.test(text.slice(tokens[i - 1].end, t.start));
        const joinsNext = i < tokens.length - 1 && removable[i + 1] && TOKEN_GAP.test(text.slice(t.end, tokens[i + 1].start));
        if (joinsPrevious || joinsNext) {
          removable[i] = true;
          changed = true;
        }
      });
    }
    if (!removable.some(Boolean)) return text;
    let result = text;
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (!removable[i]) continue;
      const before = result.slice(0, tokens[i].start).replace(CONNECTOR_BEFORE, "");
      result = `${before} ${result.slice(tokens[i].end)}`;
    }
    result = result.replace(/\s+([,.;!?])/g, "$1").replace(/\s{2,}/g, " ").replace(/^[\s,;]+|[\s,;]+$/g, "").trim();
    if (!result) return text;
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  const DAY_ABBREV = {
    "Monday": "mo",
    "Tuesday": "tu",
    "Wednesday": "we",
    "Thursday": "th",
    "Friday": "fr",
    "Saturday": "sa",
    "Sunday": "su"
  };
  function repeatConfigToRule(config) {
    if (!config) return null;
    if (config.frequency === "custom-days") {
      const byDay = (config.selectedDays ?? []).map((d) => DAY_ABBREV[d]).filter((d) => d != null);
      if (byDay.length > 0) {
        return { frequency: "weekly", interval: 1, byDay };
      }
      return null;
    }
    return {
      frequency: config.frequency,
      interval: config.interval ?? 1,
      byDay: null
    };
  }
  function keepRepeatRuleWhenOff(repeatsActive, existingRule, requestedRule) {
    return repeatsActive ? requestedRule : existingRule ?? null;
  }
  function quarterSuggestions(hour, minute, is24Hour) {
    const format = (totalMinutes) => {
      const h = Math.floor(totalMinutes / 60) % 24;
      const m = String(totalMinutes % 60).padStart(2, "0");
      if (is24Hour) return `${h === 0 ? "00" : h}:${m}`;
      return `${h % 12 === 0 ? 12 : h % 12}:${m}`;
    };
    const earlier = hour * 60 + Math.floor(minute / 15) * 15;
    return { earlier: format(earlier), later: format(earlier + 15) };
  }
  function buildSiriReminder(text, now, isRepeatRemindersActive) {
    const unsupported = findUnsupportedClockTime(text);
    if (unsupported) return { unsupportedTime: quarterSuggestions(unsupported.hour, unsupported.minute, unsupported.is24Hour) };
    const tokens = parseTokens(text);
    const actions = computeAutoApplyResult(tokens);
    let selectedDate = null;
    let selectedTime = null;
    let repeatConfig = null;
    const dateGiven = actions.some((a) => a.category !== "time");
    for (const action of actions) {
      const result = computeTokenClickResult(action.token, now, dateGiven);
      if (!result) continue;
      if (result.dateValue) selectedDate = result.dateValue;
      if (result.timeValue) selectedTime = result.timeValue;
      if (result.repeatConfig) repeatConfig = result.repeatConfig;
    }
    const toYyyyMmDd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
    const toHhMm = (h, min) => `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!selectedDate) {
      const mdMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?!\s*(?:am|pm)\b)(?:\s+(\d{4}))?\b/i);
      const dmMatch = !mdMatch ? text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)(?:\s+(\d{4}))?\b/i) : null;
      const absMatch = mdMatch || dmMatch;
      if (absMatch) {
        const monthStr = mdMatch ? absMatch[1] : absMatch[2];
        const dayStr = mdMatch ? absMatch[2] : absMatch[1];
        const yearStr = absMatch[3];
        const month = MONTH_NAME_TO_NUMBER[monthStr.toLowerCase()];
        const day = parseInt(dayStr, 10);
        if (month && day >= 1 && day <= 31) {
          if (yearStr) {
            selectedDate = new Date(parseInt(yearStr, 10), month - 1, day);
          } else {
            selectedDate = new Date(now.getFullYear(), month - 1, day);
            if (selectedDate < startOfToday) selectedDate = new Date(now.getFullYear() + 1, month - 1, day);
          }
        }
      }
    }
    if (!selectedDate && selectedTime) selectedDate = new Date(startOfToday);
    if (selectedDate && !selectedTime) selectedTime = { hour: 12, minute: 0 };
    let schedule;
    if (selectedDate && selectedTime) {
      schedule = {
        kind: "scheduled",
        date: toYyyyMmDd(selectedDate),
        time: toHhMm(selectedTime.hour, selectedTime.minute)
      };
    } else {
      schedule = { kind: "sometime" };
    }
    const repeatRule = keepRepeatRuleWhenOff(isRepeatRemindersActive, null, repeatConfigToRule(repeatConfig));
    const applied = actions.filter((a) => a.category !== "repeats" || repeatRule).map((a) => a.token);
    const displayText = titleFromAppliedTokens(text, applied);
    return { originalText: text, displayText, schedule, repeatRule };
  }
  exports.buildSiriReminder = buildSiriReminder;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
})({});
