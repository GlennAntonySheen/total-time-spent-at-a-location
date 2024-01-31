const fs = require('fs');
const path = require('path');
let data = []

const getWeekNum = (date) => {
    date = new Date(date)
    const janFirst = new Date(date.getFullYear(), 0, 1);
    // Source: https://stackoverflow.com/a/27125580/3307678
    return 'Week-' + Math.ceil((((date.getTime() - janFirst.getTime()) / 86400000) + janFirst.getDay() + 1) / 7);
}

const convertMinToHourAndMin = (minutes) => `${Math.floor(minutes / 60)}hr ${Math.floor(minutes % 60)}min`


function readFilesRecursively(folderPath) {
    // Read the contents of the folder
    const files = fs.readdirSync(folderPath);

    // Iterate through each file
    files.forEach(file => {
        // Create the full path of the file
        const filePath = path.join(folderPath, file);

        // Check if it's a directory
        if (fs.statSync(filePath).isDirectory()) {
            // If it's a directory, recursively call the function
            readFilesRecursively(filePath);
        } else if (path.extname(file) === '.json') {
            const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8')).timelineObjects

            fileContent.filter((content) =>
                content.placeVisit?.location.address.includes('WD18 8XU')
            ).forEach((content) => {
                var startDate = new Date(content.placeVisit.duration.startTimestamp);
                var endDate = new Date(content.placeVisit.duration.endTimestamp);
                var minSpentPerDay = ((endDate.getTime() - startDate.getTime()) / 1000) / 60;

                data.push({
                    Timestamp: startDate,
                    Date: startDate.toDateString(),
                    StartingTime: startDate.toLocaleTimeString('en-US'),
                    EndingTime: endDate.toLocaleTimeString('en-US'),
                    MinSpentPerDay: minSpentPerDay,
                    TimeSpend: convertMinToHourAndMin(minSpentPerDay),
                    Address: content.placeVisit.location.address
                })
            })
        }
    });
}

// Path of the root folder
readFilesRecursively('./Copy timeline data here');


data.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp))


let timeline = {}

data.forEach((day, index) => {
    const year = day.Date.slice(-4)
    const month = day.Date.slice(4, 7)
    const weekNo = getWeekNum(day.Date)
    const minutesSpent = day.MinSpentPerDay

    if (!timeline.hasOwnProperty(year)) {
        timeline[year] = {
            minutesSpentPerYear: 0
        }
    }

    if (!timeline[year].hasOwnProperty(month)) {
        timeline[year][month] = {
            minutesSpentPerMonth: 0,
            daysVisitedPerMonth: 0
        }
    }

    if (!timeline[year][month].hasOwnProperty(weekNo)) {
        timeline[year][month][weekNo] = {
            days: [],
            minutesSpentPerWeek: 0
        }
    }

    timeline[year][month][weekNo].days.push(day)
    timeline[year][month][weekNo].minutesSpentPerWeek += minutesSpent
    timeline[year][month].minutesSpentPerMonth += minutesSpent
    timeline[year][month].daysVisitedPerMonth++
    timeline[year].minutesSpentPerYear += minutesSpent

})

console.table(JSON.stringify(timeline),)

Object.entries(timeline).forEach(([yearNo, yearDetails]) => {
    console.log(`============================ 📅 ${yearNo} ============================`)
    Object.entries(yearDetails).slice(1).forEach(([monthName, monthDetails]) => {
        console.log(`==== ${monthName} ====`)
        console.log(`Total time spent in ${monthName}: ${convertMinToHourAndMin(monthDetails.minutesSpentPerMonth)}`)
        console.log(`Number of days visited: ${monthDetails.daysVisitedPerMonth}\n`)
        Object.entries(monthDetails).slice(2).forEach(([weekNo, weekDetails]) => {
            // console.table(weekDetails.days, ['Timestamp', 'Date', 'StartingTime', 'EndingTime', 'MinSpentPerDay', 'TimeSpend', 'Address'])
            console.table(weekDetails.days, ['Date', 'StartingTime', 'EndingTime', 'TimeSpend',])
            
            console.log(`Time Spent in ${weekNo}: ${weekDetails.minutesSpentPerWeek > 1200 ? '\x1b[31m' : '\x1b[36m'}${convertMinToHourAndMin(weekDetails.minutesSpentPerWeek)}\x1b[0m\n\n`);
        })
    })
});