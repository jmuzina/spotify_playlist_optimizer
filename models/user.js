const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    { 
        id: String,
        displayName: String,
        profile_picture: String,
        keys: {}
     },
    {collection: "users"}
);

exports.User = mongoose.model('User', userSchema);

exports.findOrCreate = async function(user, done) {
    var query = { id: user.id },
    update = { id: user.id, displayName: user.displayName, profile_picture: user.profile_picture, keys: user.keys },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

    // Find the document
    (this.User).findOneAndUpdate(query, update, options, function(error, result) {
        done(error, result);
    });
}

exports.updateKey = async function(user, keys, done) {
    var query = { id: user.id },
    update = { access: keys.access, refresh: keys.refresh };

    (this.User).updateOne(query, update, {}, function(error, result) {
        done(error, result);
    });
}

