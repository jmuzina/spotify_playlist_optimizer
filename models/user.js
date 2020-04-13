const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    { 
        id: String,
        displayName: String,
        profile_picture: String,
        keys: {},
        playlists: [],
        suggestions: [],
        selected_playlist: String,
        playlist_optimized: Boolean,
        playlist_created: Boolean
     },
    {collection: "users"}
);

exports.User = mongoose.model('User', userSchema);

usr = this.User

exports.deleteAll = async function(done) {
    usr.deleteMany({}, function (err) {});
    done();
}

exports.findOrCreate = async function(user, done) {
    var query = { id: user.id },
    update = { 
        id: user.id, 
        displayName: user.displayName, 
        profile_picture: 
        user.profile_picture, 
        keys: user.keys, 
        playlists: user.playlists, 
        suggestions: user.suggestions, 
        selected_playlist: user.selected_playlist,
        playlist_optimized: user.playlist_optimized,
        playlist_created: user.playlist_created
      },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

    // Find the document
    usr.findOneAndUpdate(query, update, options, function(error, result) {
        done(error, result);
    });
}

exports.find = async function(user, done) {
    usr.findOne(user, function(err, obj) {
        done(err, obj);
    })
}

exports.updateKey = async function(user, keys, done) {
    var query = { id: user.id },
    update = { access: keys.access, refresh: keys.refresh };

    usr.updateOne(query, update, {}, function(error, result) {
        done(error, result);
    });
}

exports.updateSuggestions = async function(req, arr, done) {
    var query = { id: req.user.id }, 
    update = { suggestions: JSON.parse(JSON.stringify(arr)) };

    usr.updateOne(query, update, {}, async function(error, result) {
        usr.findOne(query, function(err, updated_user){
            req.login(updated_user, function(err){
                // handle this later
            })
            done(error, updated_user);
        })
    });
}

exports.updatePlaylists = async function(req, arr, done) {
    var query = { id: req.user.id }, 
    update = { playlists: JSON.parse(JSON.stringify(arr)) };

    usr.updateOne(query, update, {}, async function(error, result) {
        usr.findOne(query, function(err, updated_user){
            req.login(updated_user, function(err){
                // handle this later
            })
            done(error, updated_user);
        })
    });
}

exports.updateSelected = async function(req, done) {
    var query = { id: req.user.id }, 
    update = { selected_playlist: req.body['selected_playlist'] };

    usr.updateOne(query, update, {}, async function(error, result) {
        usr.findOne(query, function(err, updated_user){
            req.login(updated_user, function(err){
                // handle this later
            })
            done(error, updated_user);
        })
    });
}

exports.updateCreated = async function(req, val, done) {
    var query = { id: req.user.id }, 
    update = { playlist_created: val };

    usr.updateOne(query, update, {}, async function(error, result) {
        usr.findOne(query, function(err, updated_user){
            req.login(updated_user, function(err){
                // handle this later
            })
            done(error, updated_user);
        })
    });
}

exports.updateOptimized = async function(req, val, done) {
    var query = { id: req.user.id }, 
    update = { playlist_optimized: val };

    usr.updateOne(query, update, {}, async function(error, result) {
        usr.findOne(query, function(err, updated_user){
            req.login(updated_user, function(err){
                // handle this later
            })
            done(error, updated_user);
        })
    });
}

exports.deleteUser = async function(req, done) {
    var query = { id: req.user.id };
    usr.deleteOne(query, function (err) {
        if (err) console.log(err);
        done();
    });
}