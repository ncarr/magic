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
                <p>It's also in the console in case you didn't provide a Mailgun API key</p>
                <v-progress-circular indeterminate :size="64"></v-progress-circular>
              </v-card-text>
            </v-card>
            <v-card v-if="view === 'signedin'">
              <v-card-title class="headline">You have signed in</v-card-title>
              <v-card-text>
                <p>Your email is {{ email }}</p>
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
    email: ''
  }),
  methods: {
    signin () {
      socket.emit('startAuth', this.email)
      this.view = 'waiting'
      socket.once('auth', async token => {
        await axios.post('/api/signin', { token })
        this.view = 'signedin'
      })
    }
  }
}
</script>
