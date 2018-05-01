/* function to show map (zoom at jaipur) */
var showMap = function() {
  this.map = new google.maps.Map(document.getElementById('map'), {
      center: {
          lat: 26.9124,
          lng: 75.7873
      },
      zoom: 13
  });
}


/* knockout viewmodel */
var ViewModel = function() {
  var self = this;
  self.mapmodel = new showMap();
  self.map = self.mapmodel.map;
  self.locationList = ko.observableArray();
  self.largeInfowindow = new google.maps.InfoWindow();
  self.bounds = new google.maps.LatLngBounds();

  /* to fetch locations from foursquare api */
  var cid = "5GDSY3TCOKZ3ZNP0A1HZ0BMPVW2V5BNBD3UWPSY5WZRKWR1S";
  var cs = "CETMV5VAJC0O2UYZZNDPTQOL1GPHP0XWJFVM5IY4ZVQF3MYR";
  var url = "https://api.foursquare.com/v2/venues/explore?m=foursquare&client_id=" + cid + "&client_secret=" + cs + "&v=20170510&ll=" + 26.9124 + "," + 75.7873 + "";
  $.getJSON(url).done(function(response) {
      for (var i = 0; i < response.response.groups.length; i++) {
          for (var j = 0; j < response.response.groups[i].items.length; j++) {
              var loc = {};
              loc.title = response.response.groups[i].items[j].venue.name;
              loc.lat = response.response.groups[i].items[j].venue.location.lat;
              loc.lng = response.response.groups[i].items[j].venue.location.lng;
              /* sending instance of each location to locationList */
              self.locationList.push(new location1(loc));
          }
      }
  }).fail(function(e) {
      window.alert(e);
  });

  /* to set attributes for each location */
  var location1 = function(Loc) {
      this.title = Loc.title;
      var tribeca = {
          lat: Loc.lat,
          lng: Loc.lng
      };
      this.marker = new google.maps.Marker({
          position: tribeca,
          map: self.map,
          animation: google.maps.Animation.DROP,
          title: Loc.title
      });
      /* adding listener to marker to open infowindow */
      this.marker.addListener('click', function() {
          populateInfoWindow(this, self.largeInfowindow);
      });
  };

  /* function to open infowindow with street view and name of location */
  function populateInfoWindow(marker, infowindow) {
      // Check to make sure the infowindow is not already opened on this marker.
      if (infowindow.marker != marker) {
          infowindow.marker = marker;
          infowindow.setContent('<div>' + marker.title + '</div>');
          infowindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
              infowindow.setMarker = null;
          });
          var streetViewService = new google.maps.StreetViewService();
          var radius = 50;
          // In case the status is OK, which means the pano was found, compute the
          // position of the streetview image, then calculate the heading, then get a
          // panorama from that and set the options
          function getStreetView(data, status) {
              if (status == google.maps.StreetViewStatus.OK) {
                  var nearStreetViewLocation = data.location.latLng;
                  var heading = google.maps.geometry.spherical.computeHeading(
                      nearStreetViewLocation, marker.position);
                  infowindow.setContent('<div>' + marker.title + '</div><div id="pan1"></div>');
                  var panoramaOptions = {
                      position: nearStreetViewLocation,
                      pov: {
                          heading: heading,
                          pitch: 30
                      },
                  };
                  var panorama = new google.maps.StreetViewPanorama(
                      document.getElementById('pan1'), panoramaOptions);
              } else {
                  infowindow.setContent('<div>' + marker.title + '</div>' +
                      '<div>No Street View Found</div>');
              }
          }

          // Use streetview service to get the closest streetview image within
          // 50 meters of the markers position
          streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
          // Open the infowindow on the correct marker.
          infowindow.open(self.map, marker);
      }
  }

  /* to filter the location according to search */
  self.query = ko.observable('');
  self.filterLocations = ko.computed(function() {
      var search = self.query().toLowerCase();
      return ko.utils.arrayFilter(self.locationList(), function(loc1) {
          if (loc1.title.toLowerCase().indexOf(search) >= 0) {
              loc1.marker.setMap(self.map);
          } else {
              loc1.marker.setMap(null);
          }
          return loc1.title.toLowerCase().indexOf(search) >= 0;
      });
  });
  console.log(self.filterLocations());

  /* to show infowindow onclick the location from list */
  self.showInfowindow = function(loc) {
      populateInfoWindow(loc.marker, self.largeInfowindow);
      self.bounds.extend(loc.marker.position);
      self.map.fitBounds(self.bounds);
  }
}

/* function to intitialize map */
function initMap() {
  ko.applyBindings(new ViewModel)
}

function onError() {
  window.alert("error to open map");
}