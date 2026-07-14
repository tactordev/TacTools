

// add more information to the row e.g. due date
// add priorities to nlu

export function nlu(text: string) {

    // # ---- DUE DATES ---- # \\

    // [prefix modifiers]
    // #- due [day]/[date]/[relative]
    // #- on [day]/[date]/[relative]
    // #- in [num] [timeframe] / [relative]
    // #- within [relative]
    // #- by [day]/[relative]
    // #- for [day]/[date]
    // #- before [day]/[date]
    // #- until [day]/[date]/[relative]
    // #- at [time]
    

    // [period modifiers]
    // #- early [prefix modifier]
    // #- mid [prefix modifier]
    // #- late [prefix modifier]
    // #- (by) end of [prefix modifier]
    // #- (by) start of [prefix modifier]
    // #- (by) end of [prefix modifier]
    // #- time: hh/mm, hh:mm, hh.mm, hh/mm/ss, hh:mm:ss, hh:mm.ss, hh.mm.ss, hh, [num] pm, [num] am

    // [prefix input types]
    // #- day: Mon --> Sun, weekend, weekday
    // #- month: Jan --> Dec
    // #- date: dd/mm/yy(yy), dd-mm-yy(yy), mm/dd/yy(yy), yy(yy)/mm/dd, --, dd [month] [yy(yy)]
    // #- timeframe: year, month, fortnight, week, day, hour, minute, second
    // #- relative: last [timeframe], yesterday, today, tomorrow, next [timeframe], [num] [timeframe]s ago, day after tomorrow, day before yesterday, coming [day]
    // #- period: morning, afternoon, evening, night, tonight, noon, midnight, early, late, mid

    // # ---- ---- # \\

    const inp = text.toLowerCase().trim().replace(/[^a-z0-9\s:/@-]/g, "");

    const words = inp.split(/\s+/);
    let target = new Date();
    let matched = false;

    const indexes = new Set<number>();

    const days: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    // const months: Record<string, number> = { jan: 0 , feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const timeframes: Record<string, string> = {
        year: 'year', month: 'month', week: 'week', fortnight: 'fortnight', day: 'day', hour: 'hour', minute: 'minute', second: 'second'
    };

    const nextWord = (index: number) => words[index + 1] || "";

    for (let count = 0; count < words.length; count ++) {
        const word = words[count];
        const next = nextWord(count);

        switch (word) {
            case "tomorrow":
                indexes.add(count);
                target.setDate(target.getDate() + 1);
                matched = true;
                continue;

            case "yesterday":
                indexes.add(count);
                target.setDate(target.getDate() - 1);
                matched = true;
                continue;

            case "today":
                indexes.add(count);
                matched = true;
                continue;

            case "tonight":
                indexes.add(count);
                target.setHours(20, 0, 0, 0);
                matched = true;
                continue;
        }

        if (word === "day" && next === "after" && words[count + 2] === "tomorrow") {
            indexes.add(count);
            indexes.add(count + 1);
            indexes.add(count + 2);
            target.setDate(target.getDate() + 2);
            matched = true;
            count += 2;
            continue;
        }

        if (word === "day" && next === "before" && words[count + 2] === "yesterday") {
            indexes.add(count);
            indexes.add(count + 1);
            indexes.add(count + 2);
            target.setDate(target.getDate() - 2);
            matched = true;
            count += 2;
            continue;
        }


        const numVal = parseInt(word);
        if (!isNaN(numVal)) {
            const timeframe = next.endsWith("s") ? next.slice(0, -1) : next;

            if (timeframes[timeframe]) {
                matched = true;
                const ahead2 = words[count + 2] || "";
                const ago = ahead2 === "ago" || next === "ago";
                const delta = ago ? -numVal : numVal;

                    
                indexes.add(count);
                indexes.add(count + 1);
                if (ahead2 === "ago") indexes.add(count + 2);

                switch (timeframes[timeframe]) {
                    case 'year': target.setFullYear(target.getFullYear() + delta); break;
                    case 'month': target.setMonth(target.getMonth() + delta); break;
                    case 'week': target.setDate(target.getDate() + (delta * 7)); break;
                    case 'fortnight': target.setDate(target.getDate() + (delta * 14)); break;
                    case 'day': target.setDate(target.getDate() + delta); break;
                    case 'hour': target.setHours(target.getHours() + delta); break;
                    case 'minute': target.setMinutes(target.getMinutes() + delta); break;
                }
                count += ago ? 2 : 1;
                continue;
            }
        }


        const dayKey = Object.keys(days).find(d => word.startsWith(d));
        if (dayKey) {
            matched = true;
            const targetDayNum = days[dayKey];
            const currentDayNum = target.getDay();
            let diff = targetDayNum - currentDayNum;

            indexes.add(count);
            const prev = words[count - 1] || "";
            if (prev === "next") {
                diff += 7;
                indexes.add(count - 1);
            } else if (prev === "last") {
                diff -= 7;
                indexes.add(count - 1);
            } else if (diff <= 0) {
                diff += 7;
                indexes.add(count - 1);
            }
            target.setDate(target.getDate() + diff);
            continue;
        }

        const isTimeContext = word.includes(":") || word.endsWith("pm") || word.endsWith("am") || words[count - 1] === "at" || words[count - 1] === "@";
        if (isTimeContext) {
            let hrs = parseInt(word);
            let mins = 0;

            indexes.add(count);
            if (words[count - 1] === "at" || words[count - 1] === "@") {
                indexes.add(count - 1);
            }

            if (word.includes(":")) {
                const parts = word.split(":");
                hrs = parseInt(parts[0]);
                mins = parseInt(parts[1]) || 0;
            }

            if (word.includes("pm") && hrs < 12) hrs += 12;
            if (word.includes("am") && hrs === 12) hrs = 0;
            
            if (next === "pm" && hrs < 12) { hrs += 12; indexes.add(count + 1); count++; }
            if (next === "am" && hrs === 12) { hrs = 0; indexes.add(count + 1); count++; }

            if (!isNaN(hrs)) {
                target.setHours(hrs, mins, 0, 0);
                matched = true;
            }

            if (word === "morning") target.setHours(9, 0, 0, 0);
            if (word === "afternoon") target.setHours(14, 0, 0, 0);
            if (word === "evening") target.setHours(17, 30, 0, 0);
            if (word === "night") target.setHours(21, 0, 0, 0);
            if (word === "noon") target.setHours(12, 0, 0, 0);
            if (word === "midnight") target.setHours(23, 59, 59, 999);
        }
    }

    const originalWords = text.trim().split(/\s+/);
    const filteredWords = originalWords.filter((_, idx) => !indexes.has(idx));
    const cleanedTitle = filteredWords.join(" ") || "Untitled";

    return {
        date: matched ? target : null,
        cleanedTitle: cleanedTitle
    };



};