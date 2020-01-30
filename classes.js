exports.playlist_info = class {
    constructor(id, name, images, uri) {
        this.p_id = id;
        this.p_name = name;
        this.images = images;   
        this.uri = uri; 
    }
}

exports.user_info = class {
    constructor(id, name, profile_picture, playlists) {
        this.u_id = id;
        this.p_name = name;
        this.profile_picture = profile_picture;
        this.u_playlists = playlists;
    }
}

exports.track_info = class{
    constructor(id, name, artists, uri, preview, image) {
      this.id = id;
      this.name = name;
      this.artists = artists;
      this.uri = uri;
      this.preview = preview;
      this.image = image;
    }
  }

  exports.track_comparison = class{
      constructor(id, suggested) {
          this.id = id;
          this.suggested = suggested;
      }
  }