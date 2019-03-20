<template>
  <div ref="photos" class="photos">
    <div class="sharebox">
      <div class="mm-icon" @click="goHome"></div>
      <div class="share-icon">
        <div class="icon share"></div>
        <div class="icon facebook" @click="shareFacebook"></div>
        <div class="icon line" @click="shareLine"></div>
      </div>
    </div>
    <div class="btn-toggle-description" :class="switchStatus" @click="toggleDesc"><div class="hint">開啟／關閉圖說</div></div>
    <div class="go-next-page" @click="goNextPage" :class="goNextPageClass"></div>
    <div class="progress-wrap progress mobile-only" data-progress-percent="25">
      <div class="progress-bar progress"></div>
    </div>
    <div class="leading widthDesc" :class="{ inactive: isBrowseringPics }">
      <div  class="leading_wrapper" :class="{ hide: leadingWrapperHide }">
        <div class="title"><span><h2 v-text="title"></h2></span></div>
        <div class="brief">
          <div :class="captionStyle">
            <div v-text="heroCaption"></div>
            <span v-text="get(brief, 'apiData.0.content.0', '')"></span>
          </div>
        </div>
        <div class="img">
          <img :src="get(heroImg, 'image.resizedTargets.tablet.url')" :class="landscapeClass"
                :srcset="`${get(heroImg, 'image.resizedTargets.mobile.url')} 800w,
                          ${get(heroImg, 'image.resizedTargets.tablet.url')} 1200w`" />
        </div> 
      </div>  
    </div>
    <div class="article_body">
      <div class="pic-wrapper" :class="{ active: picContainerActive }">
        <div class="pic-container">
          <section :class="[ 'pic-section', i > 0 ? '' : 'active' ]" v-for="(o, i) in imgArr">
            <div class="brief">
              <div :class="captionStyle">
                <span v-text="get(o, 'content.0.description', '')"></span>
              </div>
            </div>
            <div class="img">
              <img :src="get(o, 'content.0.tablet.url')" :class="landscapeClass"
                    :srcset="`${get(o, 'content.0.mobile.url')} 800w,
                              ${get(o, 'content.0.tablet.url')} 1200w`" />      
            </div>
          </section>
        </div>
      </div>
    </div>
    <div class="credit-comment" :class="creditCommentClass">
      <div class="credit" v-html="credit"></div>
      <RelatedListWithThumbnail :relatedList="relatedList" :isApp="isApp" />
      <!--slot name="slot_dfpFT"></slot-->
      <slot name="slot_fb_comment"></slot>      
    </div>
  </div>
</template>
<script>
  import { OnePageScroller } from 'kc-scroll'
  import { currentYPosition, elmYPosition, smoothScroll } from 'kc-scroll'
  import { getClientOS, addClass, removeClass } from 'src/util/comm'
  import { getCredit, shareLine, shareFacebook } from 'src/util/comm'
  import { filter, get, toInteger } from 'lodash'
  import RelatedListWithThumbnail from 'src/components/article/RelatedListWithThumbnail.vue'
  import verge from 'verge'

  export default {
    components: {
      RelatedListWithThumbnail
    },
    computed: {
      brief () { return get(this.articleData, 'brief') },
      captionStyle () {
        return {
          show: (this.descSwitch || !this.isLandscape),
          hide: !this.descSwitch
        }
      },
      contentArr () { return get(this.articleData, 'content.apiData', []) },
      credit () { return getCredit(this.articleData, 'white') },
      creditCommentClass () {
        return {
          show: this.creditCommentShow,
          active: this.creditCommentFixed
        }
      },
      goNextPageClass () {
        return {
          center: !this.isLandscape,
          hidden: this.goNextPageHide
        }
      },
      heroCaption () { return get(this.articleData, 'heroCaption') },
      heroImg () { return get(this.articleData, 'heroImage') },
      landscapeClass () { return { landscape: this.isLandscape } },
      imgArr () { return filter(this.contentArr, { type: 'image' }) },
      relatedList () { return get(this.articleData, 'relateds') },
      switchStatus () {
        return {
          on: this.descSwitch,
          off: !this.descSwitch,
          hide: !this.isLandscape || this.descHide
        }
      },
      title () { return get(this.articleData, 'title') },
    },
    data () {
      return {
        touchLock: false,
        currIndex: 1,
        currOS: '',
        creditCommentShow: false,
        creditCommentFixed: false,
        descHide: false,
        descSwitch: get(this.articleData, 'isAdvertised', false),
        lastAnimation: 0,
        leadingWrapperHide: false,
        isLandscape: false,
        isBrowseringPics: false,
        goNextPageHide: false,
        onePageScroll: (new OnePageScroller()),
        picContainerActive: false,
        quietPeriod: 700,
        scrollingFlag: false,
        stickflag: [],
        touchDelta: 0,
        touchStartY: 0
      }
    },
    methods: {
      currentYPosition,
      elmYPosition,
      get,
      goNextPage () {
        const nextPage = this.currIndex <= this.imgArr.length ? this.currIndex + 1 : this.currIndex
        if (this.currIndex < this.imgArr.length) {
          this.onePageScroll.moveTo(nextPage)
        } else {
          this.smoothScroll('.credit-comment')
          this.onePageScroll.pauseToggle()
        }
      },
      goHome () {
        this.$router.push('/')
      },
      goPage (e) {
        const targIndex = Number(e.target.getAttribute('index')) + 1
        let loopCount = this.currIndex
        this.onePageScroll.moveTo(targIndex)
        this.onePageScroll.cancelPause()
        while (loopCount !== targIndex) {
          if (this.currIndex < targIndex) {
            loopCount++
          } else if (this.currIndex > targIndex) {
            loopCount--
          }
        }
      },
      initOnepage () {
        this.onePageScroll.init('.pic-wrapper', {
          afterMove: index => {
            this.currIndex = toInteger(index)
            this.updateProgressbar(((this.currIndex - 1) * 100) / this.imgArr.length)
            if (this.currIndex === this.imgArr.length) {
              this.creditCommentShow = true
            } else {
              this.creditCommentShow = false
            }
          },
          animationTime: 500,
          beforeMove: () => {
            this.smoothScroll('.article_body')
          },
          defaultInitialPage: 1,
          easing: 'ease',
          pageContainer: '.pic-section',
          quietPeriod: 750
        })
      },
      mouseWheelHandlerN (evt) {
        const delta = evt.wheelDelta || -evt.detail
        if (delta < 0) {
          if (this.currIndex === this.imgArr.length) {
            this.picContainerActive = false
            this.onePageScroll.doPause()
          }
        } else if (delta > 0) {
          if (this.currIndex === 1) {
            this.picContainerActive = false
            this.onePageScroll.doPause()
            this.leadingWrapperHide = false
          } else {
            this.leadingWrapperHide = true
          }
        }
      },
      scrollHandler () {
        const deviceHeight = verge.viewportH()
        const currTop = this.currentYPosition()
        const currBtm = currTop + deviceHeight
        const articleBodyTopY = this.elmYPosition('.article_body')
        const articleBodyBtmY = articleBodyTopY + deviceHeight

        if ((articleBodyTopY <= currTop && this.currIndex === 1) || (articleBodyBtmY >= currBtm && this.currIndex === this.imgArr.length)) {
          this.picContainerActive = true
          this.touchLock = true
          if (this.onePageScroll.pauseFlag) {
            setTimeout(() => {
              this.onePageScroll.cancelPause()
            }, 1000)
          }
        } else {
          this.touchLock = false
          this.picContainerActive = false
        }
      },
      setUpHtmlHeight () {
        return new Promise((resolve) => {
          if (process.env.VUE_ENV === 'client') {
            addClass(document.body, 'limited-height')
            addClass(document.documentElement, 'limited-height')
          }
          resolve()
        })
      },
      setUpScrollHandler () {
        return new Promise((resolve) => {
          window.removeEventListener('scroll', this.scrollHandler)
          window.addEventListener('scroll', this.scrollHandler)
          resolve()
        })
      },
      setUpSelectorPreventor () {
        return new Promise(() => {
          this.$refs[ 'photos' ].ondragstart = function () { return false }
          this.$refs[ 'photos' ].onselectstart = function () { return false }
        })
      },
      setUpResizeHandler () {
        return new Promise((resolve) => {
          window.removeEventListener('resize', this.updateIsLandscape)
          window.addEventListener('resize', this.updateIsLandscape)
          resolve()
        })
      },
      smoothScroll,
      shareLine () {
        shareLine({
          route: this.$route.path,
          title: document.querySelector('meta[property="og:title"]').getAttribute('content')
        })
      },
      shareFacebook () {
        shareFacebook({ route: this.$route.path })
      },
      toggleDesc () {
        this.descSwitch = !this.descSwitch
        this.descShowDefault = false
      },
      touchEndHandlerN (event) {
        const deltaY = event.pageY - this.touchStartY
        document.removeEventListener('touchmove', this.touchMoveHandlerN)
        if (deltaY >= 50) {
          if (this.currIndex === 1) {
            this.picContainerActive = false
            this.onePageScroll.doPause()
            this.touchLock = false
            this.leadingWrapperHide = false
          } else {
            this.leadingWrapperHide = true
          }
        } else if (deltaY <= -50) {
          if (this.currIndex === this.imgArr.length) {
            this.picContainerActive = false
            this.onePageScroll.doPause()
            this.touchLock = false
            this.leadingWrapperHide = true
          }
        }
      },
      touchStartHandlerN (event) {
        const target = event.target
        const touches = event.touches
        if (touches && touches.length) {
          this.touchStartY = touches[0].pageY
          document.addEventListener('touchmove', this.touchMoveHandlerN)
          if (this.touchLock) {
            const targClass = target.getAttribute('class') || ''
            if (targClass.indexOf('go-next-page') === -1 &&
                targClass.indexOf('mm-icon') === -1 &&
                targClass.indexOf('icon line') === -1 &&
                targClass.indexOf('icon facebook') === -1 &&
                targClass.indexOf('icon g-plus') === -1 &&
                targClass.indexOf('btn-toggle-description') === -1) {
              return event.preventDefault()
            }
          }
        }
      },
      touchMoveHandlerN (event) {
        return event.preventDefault()
      },
      updateProgressbar (percentage) {
        return new Promise(() => {
          document.querySelector('.progress-bar').setAttribute('style', `left: ${percentage}%;`)
        })
      },
      updateIsLandscape () {
        const browser = typeof window !== 'undefined'
        this.isLandscape = browser && window.innerHeight < window.innerWidth
      }
    },
    mounted () {
      this.updateIsLandscape()
      this.smoothScroll(null, 0)
      this.currOS = getClientOS()

      Promise.all([
        this.setUpHtmlHeight(),
        this.setUpResizeHandler(),
        this.setUpScrollHandler(),
        this.setUpSelectorPreventor()
      ])

      if (window === undefined) {
        window.addEventListener('load', () => {
          this.initOnepage()
          this.onePageScroll.doPause()
          if (this.currOS !== 'iOS' && this.currOS !== 'Android') { document.addEventListener('mousewheel', this.mouseWheelHandlerN) }
          if (this.currOS !== 'iOS' && this.currOS !== 'Android') { document.addEventListener('DOMMouseScroll', this.mouseWheelHandlerN) }
          if (this.currOS === 'iOS' || this.currOS === 'Android') { document.addEventListener('touchstart', this.touchStartHandlerN) }
          if (this.currOS === 'iOS' || this.currOS === 'Android') { document.addEventListener('touchend', this.touchEndHandlerN) }
        })
      } else {
        this.initOnepage()
        this.onePageScroll.doPause()
        if (this.currOS !== 'iOS' && this.currOS !== 'Android') { document.addEventListener('mousewheel', this.mouseWheelHandlerN) }
        if (this.currOS !== 'iOS' && this.currOS !== 'Android') { document.addEventListener('DOMMouseScroll', this.mouseWheelHandlerN) }
        if (this.currOS === 'iOS' || this.currOS === 'Android') { document.addEventListener('touchstart', this.touchStartHandlerN) }
        if (this.currOS === 'iOS' || this.currOS === 'Android') { document.addEventListener('touchend', this.touchEndHandlerN) }
      }
    },
    beforeRouteLeave (to, from, next) {
      if (process.env.VUE_ENV === 'client') {
        this.creditCommentShow = false
        document.removeEventListener('mousewheel', this.mouseWheelHandler)
        document.removeEventListener('DOMMouseScroll', this.mouseWheelHandler)
        removeClass(document.body, 'limited-height')
        removeClass(document.documentElement, 'limited-height')
      }
      next()
    },
    name: 'ariticle-body-photo',
    props: {
      articleData: {
        default: () => ({})
      },
      viewport: {
        default: () => ({})
      },
      isApp: {
        default: false
      }
    },
    watch: {
      currIndex () {
        if (this.currIndex > 1 && this.currIndex <= this.imgArr.length) {
          this.isBrowseringPics = true
        } else {
          this.isBrowseringPics = false
        }
      },
    }
  }
</script>
<style lang="stylus" scoped>
  .photos
    -webkit-touch-callout none
    -webkit-user-select none
    -khtml-user-select none
    -moz-user-select none
    -ms-user-select none
    user-select none
  .leading
    height calc(180vh)
    &.widthDesc
      background-image linear-gradient(180deg, transparent, rgba(0,0,0,0.7))
    &.inactive
      .leading_wrapper
        .img img, .title
          display none
    
    &_wrapper
      position fixed
      top 0
      left 0
      height 100vh
      width 100vw
      &.hide
        opacity 0
     
      .title
        position relative
        span
          text-align center
          padding 20px      
          margin-bottom 0!important 
          position relative
          height auto
          width 100%
          display inline-block       

          padding-top 10%
          z-index 10
          background-image linear-gradient(0deg, transparent, rgba(0,0,0,0.5))
          h2
            font-size 2.5rem
            color #fff
            font-weight 300
            text-shadow 0.9px 0.5px 0 rgba(0, 0, 0, 0.8)
            font-family 'Noto Sans TC','STHeitiTC-Light','Microsoft JhengHei',sans-serif
      .img
          width 100%
          height 100%
          position absolute
          top 0
          left 0
          img:not([class="landscape"])
            width 100%
            height 100%
            object-fit cover
            object-position center center
            background-color #696969

      .brief
        position relative
        & > div
          height auto
          position relative        

          z-index 10
          width 100vw
          display flex
          justify-content flex-start
          align-items center
          flex-direction column
          bottom 0   

          div
            margin-bottom 20px
            color #d1d1d1
            text-shadow 0.9px 0.5px 0 rgba(0, 0, 0, 0.8)

          span
            width 70%
            color #fff
            text-align left
            word-break break-all
            display flex
            align-items center
            justify-content center
            bottom 0
            line-height 20px
            text-shadow 0.9px 0.5px 0 rgba(0, 0, 0, 0.8)
            font-size 16px

          &.hide
            display none

          &.show
            display flex
  .sharebox
    position fixed
    top 0
    left 0
    padding 20px
    z-index 99

    & > div
      display inline-block

      &.mm-icon
        width 48px
        height 48px
        background-image url(/assets/mirrormedia/favicon-48x48.png)
        background-size contain
        background-position center center
        background-repeat no-repeat
        cursor pointer

      &.share-icon
        margin-left 10px

        div
          display inline-block
          position relative

          &.icon
            width 48px
            height 48px
            background-position center center
            background-repeat no-repeat
            background-color #2068b2
            border-radius 48px
            margin-left 10px
            -webkit-transition all .1s ease-out
            transition all .1s ease-out
            cursor pointer

            &.share
              margin-left 0
              background-image url(/assets/mirrormedia/icon/share-white.png)
              background-size 50%
            
            &.facebook
              background-image url(/assets/mirrormedia/icon/facebook_white.png)
              background-size 35%
              -webkit-transition-delay 50ms
              transition-delay 20ms
              
            &.line
              background-image url(/assets/mirrormedia/icon/line_white.png)
              background-size 70%
              background-color #20b22c   
              -webkit-transition-delay 75ms
              transition-delay 40ms

            &.g-plus
              background-image url(/assets/mirrormedia/icon/google-plus.png)
              background-size 70%
              background-color #c00   
              -webkit-transition-delay 75ms
              transition-delay 40ms

            &:active, &:focus, &:hover
              box-shadow inset 0 0 4px rgba(0,0,0,.7), 0 4px 8px rgba(0,0,0,.7)
              
            &:not(:first-child)
              width 48px
              height 48px
              margin-left 0
              opacity 0
              -webkit-transform translateX(0)
                  -ms-transform translateX(0)
                      transform translateX(0)
        &:hover 
          .icon:not(:first-child)
            opacity 1
            -webkit-transform none
                -ms-transform none
                    transform none
            margin-left 10px
  
  .btn-toggle-description
    align-items center
    background-position center center
    background-repeat no-repeat
    background-size contain
    border-radius 5px
    bottom 20px
    color #fff
    cursor pointer
    display flex
    font-size 20px
    left 20px
    justify-content center
    height 40px
    position fixed
    transition all .1s
    z-index 23
    width 40px

    .hint
      font-size 1rem
      width 150px
      position absolute
      top -22px
      left 5px
      color rgba(255, 255, 255, 0.8)
      cursor auto
      display none

    &.on
      background-image url(/assets/mirrormedia/icon/caption-on.png)
      opacity 0.65
      
    &.off
      background-image url(/assets/mirrormedia/icon/caption-off.png)
      
    &.hide
      display none

    &:hover
      background-image url(/assets/mirrormedia/icon/caption-on.png)
      opacity 1

      .hint
        display block
  .progress 
    width 100%
    height 10px

  .progress-wrap 
    position fixed
    top 0
    left 0
    background #5b7d9e
    overflow hidden
    z-index 100
    .progress-bar 
      background rgba(0, 0, 0, 0.7)
      left 0
      position absolute
      top 0
      transition left 1s
  
  .progress-sidebar
    position fixed
    right 10px
    bottom 60px
    height 80vh
    width 35px
    z-index 99

    .stick-container
      position relative
      height 100%
      width 100%

      .stick
        border-top 3px solid rgba(255, 255, 255, 0.5)
        width 100%
        transform rotate(25deg)
        margin 10px auto
        position absolute
        transition bottom 0.5s
        cursor pointer

        &:hover
          border-top 3px solid rgba(255, 255, 255, 1)
  .credit-comment
    width 100vw
    position relative
    padding 5% 0
    background-color #333333
    overflow auto
    height auto
    display none
    z-index 21
    .credit
      padding 0 20px
      width 100%
      display block    

      color #fff
      height 100px
      vertical-align top
      margin 40px auto
      position relative
      text-shadow 0.9px 0.5px 0 rgba(0, 0, 0, 0.8)
      a, a:hover, a:link, a:visited
        color #fff
    
    .related-container
      width 100%
      margin 0      
    
    .article_fb_comment, .facebook-comments
      background-color rgb(255, 255, 255)
      padding 1.5rem
      width 100%
      margin 40px auto 0  

    &.show
      display block
    &.active
      position fixed
      top 0
      left 0
  .go-next-page
      position fixed
      width 35px
      height 35px
      bottom 20px
      background-color rgba(218, 218, 218, 0.37)
      background-image url(/assets/mirrormedia/icon/continue.png)
      background-repeat no-repeat
      background-size contain
      background-position center center
      border-radius 10px
      z-index 23
      cursor pointer
      -webkit-transition all .1s
      transition all .1s
      right 10px

      &.center
        left 50%
        margin-left -20px 
        height 40px
        width 40px

      &:hover
        background-color rgba(240, 240, 240, 0.8)
        text-shadow 0.9px 0.5px 0 rgba(0, 0, 0, 0.8)

      &.hidden
        display none

  .article_body
    height 100vh
    width 100vw
    overflow hidden
    > .pic-wrapper
      width 100vw
      height 100vh
      &.active
        position fixed
        top 0
        left 0
        z-index 22
      > .pic-container
        &.active
          position fixed
          top 0
          left 0
        > .pic-section
          width 100vw
          height 100vh
          overflow hidden
          position relative
          background-color #000        
          .img
            img:not([class="landscape"])
              object-fit contain
              object-position 0 20%
              background-color #696969          
            img
              object-fit contain
              max-height 100%
              position absolute
              z-index 0
              height 100vh
              width 100vw
              object-position center center
    .brief
      & > div
        position absolute
        z-index 10
        height 40vh
        width 100vw
        display flex
        justify-content flex-start
        align-items center
        flex-direction column
        background-image linear-gradient(180deg,transparent,rgba(0,0,0,0.7))
        bottom 0   

        div
          margin-bottom 20px
          color #d1d1d1
          text-shadow 0.9px 0.5px 0 rgba(0, 0, 0, 0.8)

        span
          width 70%
          color #fff
          text-align left
          word-break break-all
          display flex
          align-items center
          justify-content center
          bottom 0
          line-height 20px
          text-shadow 0.9px 0.5px 0 rgba(0, 0, 0, 0.8)
          font-size 16px

        &.hide
          display none

        &.show
          display flex    


  @media screen and (-webkit-min-device-pixel-ratio:0) and (orientation:landscape)
    .go-next-page
      bottom auto
      top 23px
    .btn-toggle-description
      bottom auto
      left auto
      top 20px
      right 55px
      .hint
        top 45px
        left auto
</style>
