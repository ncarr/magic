<template>
  <v-app>
    <v-content>
      <v-container>
        <v-layout column justify-center align-center>
          <v-flex xs12 sm8 md6>
            <v-card v-if="view === 'signin'">
              <v-card-title class="headline">Sign in</v-card-title>
              <v-card-text>
                <p>Enter your email address: </p>
                <v-text-field
                  name="email"
                  label="Email"
                  type="email"
                  v-model="email"
                  required
                ></v-text-field>
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" flat @click="signin">Sign in</v-btn>
              </v-card-actions>
            </v-card>
            <v-card v-if="view === 'waiting'">
              <v-card-title class="headline">Check your email</v-card-title>
              <v-card-text>
                <p>If you ran this in development mode, your default browser would have opened with a preview of the email. Note that the preview may not work in Edge.</p>
                <v-progress-circular indeterminate :size="64"></v-progress-circular>
              </v-card-text>
            </v-card>
            <v-card v-if="view === 'signedin'">
              <v-card-title class="headline">You have signed in</v-card-title>
              <v-card-text>
                <p>Your email is {{ email }}</p>
              </v-card-text>
            </v-card>
            <v-card v-if="error">
              <v-card-title class="headline">An error occurred</v-card-title>
              <v-card-text>
                <p>{{ error.message }}</p>
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import axios from 'axios'
import socket from '~/plugins/socket.io.js'

export default {
  data: () => ({
    view: 'signin',
    email: '',
    error: null
  }),
  methods: {
    signin () {
      socket.emit('startAuth', this.email)
      this.view = 'waiting'
      socket.on('error', err => (this.error = err))
      socket.once('auth', token => {
        axios.post('/api/signin', { token })
          .then(() => (this.view = 'signedin'))
          .catch(err => (this.error = err))
      })
    }
  }
}
</script>
