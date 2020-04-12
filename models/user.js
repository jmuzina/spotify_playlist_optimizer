const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    { id: String },
    {collection: "users"}
);

exports.User = mongoose.model('User', userSchema);

exports.findOrCreate = async function(user) {
    var query = {},
    update = { id: user.id },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

    // Find the document
    (this.User).findOneAndUpdate(query, update, options, function(error, result) {
        if (error) return;

    console.log("here we are");
    // do something with the document
});

}

