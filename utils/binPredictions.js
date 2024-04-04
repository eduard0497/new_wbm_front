  const mock_devices = [
    {
      unique_id: 1,
      lat: 34.242245312686954,
      lng: -118.53043313617162,
      battery: 24,
        level: 50,
    },
    {
      unique_id: 2,
      lat: 34.24162486342446,
      lng: -118.53312379123766,
      battery: 22,
        level: 55,
    },
    {
      unique_id: 3,
      lat: 34.23864450968821,
      lng: -118.52814541323107,
      battery: 50,
        level: 60,
    },
    {
      unique_id: 4,
      lat: 34.2383384,
      lng: -118.5319139,
      battery: 50,
      level: 45,
    }
  ];

 const exampleCurrentFillLevels = {
    1: 50,
    2: 23,
    3: 60,
    4: 23,
};

// Example predictions object to simplify demo of fill rate prediction:
 const example_predictions = {
    1: "2024-04-03T19:00:00Z",
    2: "2024-04-04T18:00:00Z",
    3: "2024-04-06T09:00:00Z",
    4: "2024-04-05T08:00:00Z",
};

const thresholdInHours = 17;

const fullThreshold = 75

//dynamically set example bins data
function generateDynamicBinsData(startLevel = 10, incrementPerEntry = 5, totalEntries = 10, intervalHours = 3) {
    const binsData = {};
    let startTimestamp = new Date(); // Start from the current date and time

    // For demonstration, let's adjust the startTimestamp to the beginning of today for clarity
    startTimestamp.setDate(startTimestamp.getDate() - 1); //start one day ago
    startTimestamp.setHours(0, 0, 0, 0);

    // Assuming you have 4 bins as in your mock_devices
    for (let binId = 1; binId <= 4; binId++) {
        const entries = [];
        let currentLevel = startLevel;
        for (let i = 0; i < totalEntries; i++) {
        const timestamp = new Date(startTimestamp.getTime() + i * intervalHours * 60 * 60 * 1000);
        entries.push({ timestamp: timestamp.toISOString(), level: currentLevel });
        currentLevel += incrementPerEntry; // Increment the level for each entry
        }
        binsData[binId] = entries;
    }
    return binsData;
}

const exampleBinsData = generateDynamicBinsData();
//console.log(exampleBinsData); // Debugging log


function getFillRates(binsData) {
    let fillRates = {};

    for (let binId in binsData) {
        let binData = binsData[binId];
        let totalFillIncrease = 0;
        let totalTimeInHours = 0;

        for (let i = 0; i < binData.length - 1; i++) {
            let start = binData[i];
            let end = binData[i + 1];
            let startTimestamp = new Date(start.timestamp);
            let endTimestamp = new Date(end.timestamp);

            let fillIncrease = end.level - start.level;
            let timeDifferenceInHours = (endTimestamp - startTimestamp) / (1000 * 60 * 60);

            totalFillIncrease += fillIncrease;
            totalTimeInHours += timeDifferenceInHours;
        }

        let averageFillRate = totalFillIncrease / totalTimeInHours;
        fillRates[binId] = averageFillRate.toFixed(2) + " units/hour";
    }

    return fillRates;
}



function getLastPingTimes(binsData) {
    let lastPingTimes = {};

    for (let binId in binsData) {
        const binData = binsData[binId];
        const lastDataPoint = binData[binData.length - 1];
        lastPingTimes[binId] = lastDataPoint.timestamp;
    }
    return lastPingTimes;
}

function hoursToFull(binsData, fillRates, currentFillLevels) {
    let hoursToFullResults = {};

    for (let binId in binsData) {
        const fillRate = parseFloat(fillRates[binId].split(" ")[0]); // Extract fill rate
        const currentFillLevel = currentFillLevels[binId];
        
        if (fillRate <= 0) {
            hoursToFullResults[binId] = "Fill rate is zero or negative, cannot predict.";
            continue;
        }

        const hoursToFull = (fullThreshold - currentFillLevel) / fillRate;
        if (hoursToFull < 0) {
            hoursToFullResults[binId] = "Bin is already above the fullness threshold.";
            continue;
        }

        hoursToFullResults[binId] = hoursToFull; // Just return the hours to full
    }

    return hoursToFullResults;
}


function predictTimestamp(binsData, hoursToFullResults) {
    let predictions = {};
    const lastPingTimes = getLastPingTimes(binsData); // Get the last ping times for all devices

    for (let binId in binsData) {
        const hoursToFull = hoursToFullResults[binId];
        const latestPingTimestamp = new Date(lastPingTimes[binId]);
        const predictionTime = new Date(latestPingTimestamp.getTime() + hoursToFull * 3600 * 1000); // Add hoursToFull to the latest ping time
        predictions[binId] = predictionTime.toISOString();
    }
    return predictions;
}



function binsForPickup(predictions, thresholdInHours, mock_devices) {
    const currentTime = new Date();
    let binsToPickup = [];

    for (let binId in predictions) {
        const prediction = predictions[binId];

        //console.log(`Prediction for bin ${binId}: ${prediction}`); // Debugging log

        const predictedFullTime = new Date(prediction);
        predictedFullTime.setHours(predictedFullTime.getHours() + 7); // change if we switch to DB and doesn't need manual adjustment
        const timeDiff = (predictedFullTime - currentTime) / (1000 * 60 * 60);
        //console.log("predictedFullTime: ", predictedFullTime, "Current Time: ", currentTime); // Debugging log
        //console.log(`Time diff for bin ${binId}: ${timeDiff}`); // Debugging log

        if (timeDiff <= thresholdInHours) {
            //console.log("DOING THIS: ", binId, ". Because: ", timeDiff, "less than or equal to: ", thresholdInHours); // Debugging log
            const deviceToPickup = mock_devices.find(device => device.unique_id === parseInt(binId, 10));

            if (deviceToPickup) {
                binsToPickup.push(deviceToPickup);
            }
        }
        else{
            //console.log("**NOT DOING THIS: ", binId, ". Because: ", timeDiff, "is greater than: ", thresholdInHours); // Debugging log
        }
            


    }

    return binsToPickup;
}



const fillRates = getFillRates(exampleBinsData);
const lastPingTimes = getLastPingTimes(exampleBinsData);
const numHours = hoursToFull(exampleBinsData, fillRates, exampleCurrentFillLevels);
const predictedTimes = predictTimestamp(exampleBinsData, numHours);
export const predictedDevices = binsForPickup(predictedTimes, thresholdInHours, mock_devices);

//console.log("Fill Rates: ", fillRates); // Debugging log
//console.log("Last Ping: ", lastPingTimes); // Debugging log
//console.log("Hours until full: ", numHours); // Debugging log
//console.log("Predicted Time for pick-up: ", predictedTimes); // Debugging log
//console.log("These bins will be picked up: ", predictedDevices); // Debugging log




