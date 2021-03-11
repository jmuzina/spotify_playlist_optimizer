
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statsSchema = new Schema(
    { 
        id: Number,
        tracksSuggested: Number,
        playlistsCreated: Number,
        playlistsOptimized: Number,
        tracksRemoved: Number,
        tracksAdded: Number
     },
    {collection: "stats"}
);

exports.Stats = mongoose.model('Stats', statsSchema);

stats = this.Stats;

exports.findOrCreate = async function(stat, done) {
    var query = { id: 0 },
    update = { 
        tracksSuggested: stat.tracksSuggested,
        playlistsCreated: stat.playlistsCreated,
        playlistsOptimized: stat.playlistsOptimized,
        tracksRemoved: stat.tracksRemoved,
        tracksAdded: stat.tracksAdded
      },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

    // Find the document
    stats.findOneAndUpdate(query, update, options, function(error, result) {
        done(error, result);
    });
}

exports.find = async function(done) {
    stats.findOne({ id: 0 }, function(err, obj) {
        done(err, obj);
    })
}

exports.updateSuggested = async function(add, done) {
    var query = { id: 0 },
    update = { $inc: { tracksSuggested: add }};

    stats.updateOne(query, update, {}, function(error, result) {
        done(error, result);
    });
}

exports.updateCreated = async function(add, done) {
    var query = { id: 0 },
    update = { $inc: { playlistsCreated: add }};

    stats.updateOne(query, update, {}, function(error, result) {
        done(error, result);
    });
}

exports.updateOptimized = async function(add, done) {
    var query = { id: 0 },
    update = { $inc: { playlistsOptimized: add }};

    stats.updateOne(query, update, {}, function(error, result) {
        done(error, result);
    });
}

exports.updateRemoved = async function(add, done) {
    var query = { id: 0 },
    update = { $inc: { tracksRemoved: add }};

    stats.updateOne(query, update, {}, function(error, result) {
        done(error, result);
    });
}

exports.updateAdded = async function(add, done) {
    var query = { id: 0 },
    update = { $inc: { tracksAdded: add }};

    stats.updateOne(query, update, {}, function(error, result) {
        done(error, result);
    });
}