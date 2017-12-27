<template>
  <v-app>
    <v-content>
      <v-container>
        <v-layout column justify-center align-center>
          <v-flex xs12 sm8 md6>
            <v-card>
              <v-card-title class="headline">Signing you into your other device...</v-card-title>
              <v-progress-circular :indeterminate="!done" :size="64" :value="100"></v-progress-circular>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import axios from 'axios'

export default {
  data: () => ({
    done: false
  }),
  async mounted () {
    await axios.post(`/api/auth/magic/${encodeURIComponent(this.$route.params.token)}`)
    this.done = true
  }
}
</script>
