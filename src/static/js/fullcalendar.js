import activitiesJson from '../data/2022-schedule.json' assert {type: 'json'};
const activities = activitiesJson.activities;
for (const a of activities){
    if (a.resourceId == "" || !a.resourceId) a.resourceId = "invalid";
}
import resourcesJson from '../data/resources.json' assert {type: 'json'};
const resources = resourcesJson.resources;

document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "resourceTimeline",
    resources: resources,
    resourceOrder: 'sortOrder',
    schedulerLicenseKey: "CC-Attribution-NonCommercial-NoDerivatives",
    events: activities,
    slotMinTime: '7:00:00',
    slotMaxTime: '22:00:00',
    now: '2022-08-19',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'list,resourceTimeline'
    },
    height: "auto",
    eventDidMount: function(info) {
        var tooltip = new Tooltip(info.el, {
          title: info.event.title,
          placement: 'top',
          trigger: 'hover',
          container: 'body'
        });
      },

  });
  calendar.render();
});
