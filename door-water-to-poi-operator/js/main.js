'use strict';
(function () {
  let doorSensors = [];
  let waterSensors = [];

  const internalUrl = function internalUrl(data) {
    let url = document.createElement("a");
    url.setAttribute('href', data);
    return url.href;
  };

  // Transform a single pair of door and water sensor into a poi
  const transformToPoi = function (door, water) {
    let poi = {};
    if (door && water) {
      poi.id = door.id + '|' + water.id;
      poi.tooltip = 'Schacht- und Wassersensor';
      poi.data = { door, water };
      poi.title = 'Schacht- und Wassersensor';
    }
    else if (door) {
      poi.id = door.id;
      poi.tooltip = 'Schachtsensor';
      poi.data = { door };
      poi.title = 'Schachtsensor';
    }
    else if (water) {
      poi.id = water.id;
      poi.tooltip = 'Wassersensor';
      poi.data = { water };
      poi.title = 'Wassersensor';
    }
    else {
      return null;
    }

    // PoI location
    poi.location = door ? door.location : water.location;
    // PoI icon
    if (water && water.waterLeak) {
      // Show red marker signaling water 
      poi.icon = internalUrl("images/water_leak.png");
    }
    else if (door && door.doorOpen) {
      // Show red marker signaling the open door
      poi.icon = internalUrl("images/door_open.png");
    }
    else {
      // Show a generic green marker
      poi.icon = internalUrl("images/generic_marker.png");
    }

    // Build info window
    poi.infoWindow = '<div>';
    poi.infoWindow += `<span style="font-size: 12px;"><b>Standort:</b> ${door ? door.address.streetAddress : water.address.streetAddress}, ${door ? door.address.addressLocality : water.address.addressLocality}</span><br />`;
    poi.infoWindow += `<span style="font-size: 12px;"><b>Letztes Update:</b> ${(water && door && new Date(water.TimeInstant).getTime() > new Date(door.TimeInstant).getTime()) || water ? new Date(water.TimeInstant).toLocaleString() : new Date(door.TimeInstant).toLocaleString()}</span><hr />`;
    if (door) {
      poi.infoWindow += `<span style="font-size: 12px;"><b>Messwerte Schachtsensor</b></span><br />`;
      poi.infoWindow += `<span style="font-size: 12px;">Zustand: ${door.doorOpen ? 'Schacht geöffnet' : 'Schacht geschlossen'}</span><br />`;
      poi.infoWindow += `<span style="font-size: 12px;">Gemessene Öffnungen: ${door.doorOpenTimes}</span><br />`;
      poi.infoWindow += `<span style="font-size: 12px;">Letzte Öffnungsdauer: ${door.lastDoorOpenDuration} min</span>`;
    }
    if (door && water) {
      poi.infoWindow += `<hr />`
    }
    if (water) {

      poi.infoWindow += `<span style="font-size: 12px;"><b>Messwerte Wassersensor</b></span><br />`;
      poi.infoWindow += `<span style="font-size: 12px;">Zustand: ${water.waterLeak ? 'Wassereinbruch' : 'Kein Wassereinbruch'}</span><br />`;
      poi.infoWindow += `<span style="font-size: 12px;">Gemessene Wassereinbrüche: ${water.waterLeakTimes}</span><br />`;
      poi.infoWindow += `<span style="font-size: 12px;">Letzte Wassereinbruchsdauer: ${water.lastWaterLeakDuration} min</span>`;
    }
    poi.infoWindow += '</div>';

    return poi;
  }
  // Group sensors and transform them one by one
  const generatePois = function () {
    // Group sensors by their coordinates (at most one door and one water sensor per group)
    let groupedSensors = [];
    for (let sensor of doorSensors) {
      // Only LoraDoorSensor is currently supported
      if (sensor.type !== 'LoraDoorSensor') continue;
      groupedSensors.push({ door: sensor });
    }
    for (let sensor of waterSensors) {
      // Only LoraWaterSensor type is currently supported
      if (sensor.type !== 'LoraWaterSensor') continue;
      let groupFound = false;
      for (let group of groupedSensors) {
        if (sensor.location.coordinates[0] === group.door.location.coordinates[0] &&
          sensor.location.coordinates[1] === group.door.location.coordinates[1]) {
          // The water sensor has the same coordinates as the door sensor in the current group
          if (!group.water) {
            // The water sensor can be assigned to the current group
            group.water = sensor;
            groupFound = true;
          }
          else {
            // There is already a water sensor assigned to this group
            console.warn("Dropping sensor as there are multiple water sensors with the same coordinates!");
            groupFound = true;
          }
        }
      }
      if (!groupFound) {
        // There was no matching group
        groupedSensors.push({ water: sensor });
      }
    }

    // Transform each group into a PoI
    return groupedSensors.map(group => transformToPoi(group.door, group.water));
  };
  // Publish pois
  const publishPois = function () {
    let pois = generatePois();
    MashupPlatform.wiring.pushEvent('poiOutput', pois);
  };

  MashupPlatform.wiring.registerCallback('doorInput', function (input) {
    doorSensors = input;
    publishPois();
  });
  MashupPlatform.wiring.registerCallback('waterInput', function (input) {
    waterSensors = input;
    publishPois();
  })
})();