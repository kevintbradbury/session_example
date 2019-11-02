var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: { type: String, required: true, index: { unique: true }, minlength: 5 },
    password: { type: String, required: false, select: false, minlength: 5 },
    resetPassToken: String
});

let options = {
    interval: 1500, // 1.5 seconds
    maxInterval: (1000 * 60 * 60 * 2), // 2 hours
};

userSchema.plugin(passportLocalMongoose, options);

module.exports = mongoose.model("User", userSchema);
