// Import JWT library
const jwt = require('jsonwebtoken')

// Create keys (in a production app you would create them on first run and load them from files so they stay consistent between restarts)
const EC = require('elliptic').ec
const curve = new EC('p256')
const KeyEncoder = require('key-encoder')
const keyEncoder = new KeyEncoder({
  curveParameters: [1, 2, 840, 10045, 3, 1, 7],
  privatePEMOptions: {label: 'EC PRIVATE KEY'},
  publicPEMOptions: {label: 'PUBLIC KEY'},
  curve
})
const emailKeyPair = curve.genKeyPair()
const emailPrivateKey = keyEncoder.encodePrivate(emailKeyPair.getPrivate('hex'), 'raw', 'pem')
const emailPublicKey = keyEncoder.encodePublic(emailKeyPair.getPublic().encode('hex'), 'raw', 'pem')
const authKeyPair = curve.genKeyPair()
const authPrivateKey = keyEncoder.encodePrivate(authKeyPair.getPrivate('hex'), 'raw', 'pem')
const authPublicKey = keyEncoder.encodePublic(authKeyPair.getPublic().encode('hex'), 'raw', 'pem')
const sessionSecret = require('crypto').randomBytes(256).toString('hex')

// Set up demo in-memory datastore
const Datastore = require('nedb-promise')
const db = new Datastore()

// Set up express, Nuxt, and Socket.io
const { Nuxt, Builder } = require('nuxt')
const app = require('express')()
const http = require('http').Server(app)
app.use(require('body-parser').json())
const io = require('socket.io')(http)

// Import and Set Nuxt.js options
let config = require('./nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

// Init Nuxt.js
const nuxt = new Nuxt(config)

// Build only in dev mode
if (config.dev) {
  const builder = new Builder(nuxt)
  builder.build()
}

// Uses MemoryStore for demo, change for a production app
app.use(require('express-session')({
  secret: sessionSecret,
  name: 'magic.sid',
  saveUninitialized: false,
  resave: false
}))

// Set up passport
const passport = require('passport')
passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser((_id, done) => db.findOne({ _id }).then(user => done(null, user)).catch(done))
app.use(passport.initialize())
app.use(passport.session())

// Send the token when the user inititates the request
io.on('connection', socket => {
  socket.on('startAuth', email => {
    const token = jwt.sign({ email, socket: socket.id }, emailPrivateKey, { expiresIn: '15 minutes', algorithm: 'ES256' })
    console.log(`http://localhost:3000/auth/magic/${encodeURIComponent(token)}`)
    // TODO: email this, rate limiting
  })
})

// Notify the server that you have received the token
app.post('/api/auth/magic/:token', (req, res, next) => {
  const { socket, email } = jwt.verify(req.params.token, emailPublicKey)
  const authToken = jwt.sign({ email }, authPrivateKey, { expiresIn: '1 minute', algorithm: 'ES256' })
  io.sockets.to(socket).emit('auth', authToken)
  res.send('OK')
})

// Actually sign you in and set your session, etc
app.post('/api/signin', async (req, res, next) => {
  try {
    if (req.user) {
      return next()
    } else {
      const { email } = jwt.verify(req.body.token, authPublicKey)
      const user = await db.findOne({ email })
      if (user) {
        req.login(user, next)
      } else {
        await db.insert({ email })
        next()
      }
    }
  } catch (e) {
    next(e)
  }
}, (req, res) => res.send(req.user))

// Give nuxt middleware to express
app.use(nuxt.render)

http.listen(process.env.PORT || 3000)
