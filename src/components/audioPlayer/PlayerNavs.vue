<template>
  <nav class="navs">
    <img
      class="navs__play"
      v-lazy="`/assets/mirrormedia/icon/audio_player_icon_${isPlaying ? 'pause' : 'play'}.png`"
      :key="isPlaying ? 'pause' : 'play'"
      alt=""
      @click="$emit(isPlaying ? 'pause' : 'play')"
    >
  </nav>
</template>

<script>
export default {
  props: {
    isPlaying: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="stylus" scoped>
.navs
  display flex
  align-items center
  justify-content center
  width 25px
  height 25px
  overflow hidden
  &__play
    cursor pointer
    height 34px
</style>
