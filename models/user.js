const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    { 
        id: String,
        displayName: String,
        profile_picture: String,
        keys: {},
        suggestions: []
     },
    {collection: "users"}
);

exports.User = mongoose.model('User', userSchema);

usr = this.User

exports.findOrCreate = async function(user, done) {
    var query = { id: user.id },
    update = { id: user.id, displayName: user.displayName, profile_picture: user.profile_picture, keys: user.keys, suggestions: user.suggestions },
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
                console.log("error reserializing:");
                console.log(err);
            })
            done(error, updated_user);
        })
    });
}