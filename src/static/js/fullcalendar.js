document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "resourceTimeline",
    resources: async function fetchActivities() {
      let response = await fetch('https://misty-apartment-xwcb8y.netlify.app/.netlify/functions/resources');
    
      console.log(response.status); // 200
      console.log(response.statusText); // OK
    
      if (response.status === 200) {
        let data = await response.json();
        console.log(data)
        const resources = data.resources;
        return resources;
      }
    },
    resourceOrder: 'sortOrder',
    schedulerLicenseKey: "CC-Attribution-NonCommercial-NoDerivatives",
    events: async function fetchActivities() {
      let response = await fetch('https://misty-apartment-xwcb8y.netlify.app/.netlify/functions/schedule');
    
      console.log(response.status); // 200
      console.log(response.statusText); // OK
    
      if (response.status === 200) {
        let data = await response.json();
        console.log(data)
        const activities = data.activities;
        for (const a of activities){
            if (a.resourceId == "" || !a.resourceId) a.resourceId = "invalid";
        }
        return activities;
      }
    },
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
