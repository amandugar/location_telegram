const express = require("express")
const bodyParser = require('body-parser')
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const ejs = require("ejs")
const mongoose = require("mongoose")
var usernameAuthenticated = "";
const app = express()

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "Its a Secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://amandugar:amandugar@cluster0.y6axd.mongodb.net/locationTrackDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    fName: String,
    lName: String,
    username: { type: String, unique: true },
    password: String,
    tCode: { type: String },
    distance: Number
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render("home")
})

app.post("/login", function (req, res) {
    let username = req.body.username;
    const user = new User({
        username: username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                usernameAuthenticated = username;
                res.redirect(`/${username}/home`);
            });
        }
    });
})

app.get("/:username/home", function (req, res) {
    if (req.isAuthenticated() && req.params.username === usernameAuthenticated) {
        res.render("first", {
            username: req.params.username
        })
    } else {
        res.redirect("/")
    }
})

app.post("/signup", function (req, res) {
    let username = req.body.username;
    let email = req.body.email;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let tcode = req.body.icode;
    User.register({ email: email, username: username, fName: firstname, lName: lastname, tCode: tcode, distance: 0 }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/")
        }
    })
})

app.post("/:username/home", function (req, res) {
    let lat1 = 28.366953;
    let long1 = 77.325288;
    let lat2 = req.body.lat;
    let long2 = req.body.long;
    var distance1 = distance(lat1, long1, lat2, long2, "K");
    User.updateOne({ username: req.body.username }, { distance: distance1 }, function (err) {
        if (err) {
            console.log(err);
        }
    })
    console.log(distance1);
})

function distance(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit == "K") { dist = dist * 1.609344 }
        if (unit == "N") { dist = dist * 0.8684 }
        return dist;
    }
}

app.listen(5000, function (req, res) {
    console.log("Listening at port 5000")
})
