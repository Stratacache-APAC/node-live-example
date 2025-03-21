<template>
  <!-- <SpeechToText/> -->
  <TextToSpeech/>
</template>
<script>
import SpeechToText from './components/speechToText.vue'
import TextToSpeech from './components/textToSpeech.vue';
export default {
  name: 'App',
  components :{
    SpeechToText,
    TextToSpeech
  }
}
</script>