const express = require("express"),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local").Strategy,
    mongoose = require("mongoose"),
    passport = require("passport"),
    helmet = require("helmet"),
    rateLimit = require("express-rate-limit"),
    cookieSession = require('cookie-session'),
    session = require("express-session"),
    app = express();

const User = require("./models/user");

// Set rate limit 
const limiter = rateLimit({
    windowMs: (3000), // 3 secs
    max: 10 // 5 requests per windowMs
});

// DB config -- Set unique name for DB & add to ENV vars
mongoose.connect("mongodb://localhost/local", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;

// Parsing for body data in API requests
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.use(bodyParser.json({ limit: "5mb" }));

// Settings for client-side content
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Implementing Ratelimiter & Header Content Security Policy for HTTP/S
app.use(limiter);
app.use(cookieParser());
app.use(cookieSession({
    name: Math.floor(Math.random() * 1000),
    keys: [process.env.COOKIE_KEY1, process.env.COOKIE_KEY2],
    secret: Math.floor(Math.random() * 1000),
    cookie: {
        secure: true,
        httpOnly: true,
        path: '/',
        expires: new Date(Date.now() + (60 * 60 * 100))
    }
}))
app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

// Socket settings for Logged in sessions
app.use(
    session({
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.on("error", err => {
    console.log(err.message);
});

app.listen(process.env.PORT, process.env.IP, function () {
    console.log("Server listening at PORT: ", process.env.PORT);
});

app.get('/', (req, res) => {
    res.render('login')
})

app.post('/home', async (req, res) => {
    const authenticate = await User.authenticate(),
        usernm = req.body.username,
        passwrd = req.body.password;

    authenticate(usernm, passwrd, (err, user) => {
        if (err || !user) {
            res.status(400).send('Request not authenticated')
            return
        }
        res.render('home')
    })
})

app.post('/signup', (req, res) => {
    let user = new User({ username: req.body.username, password: req.body.password })

    User.register(user, req.body.password, (err, savedUser) => {
        if (err || !savedUser) {
            console.log(err);
            res.status(400).send('Error saving user')
            return
        }
        res.redirect('/')
    })
})
