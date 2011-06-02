// Read 
var plist = require('./plist');

var parser = new plist.Parser();
parser.parse(process.argv[2] || (process.env.HOME + "/Music/iTunes/iTunes Music Library.xml"),
             function (err, library) {
                 if (err) throw err;
                 var artists = { unknown: 0 };
                 var count = 0;
                 for (var trackNumber in library['Tracks']) {
                     var track = library['Tracks'][trackNumber];
                     var artist = track['Artist'];
                     if (artist) {
                         artists[artist] = (artists[artist] || 0) + 1;
                     } else {
                         artists.unknown++;
                     }
                     count++;
                 }
                 for (var artist in artists) {
                     console.log(artists[artist], artist);
                 }
                 console.log('number of tracks:', count);
             });
