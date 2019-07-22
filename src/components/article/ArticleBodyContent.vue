<template>
  <div class="content">
    <div
      v-for="(p, index) in content"
      class="content-item"
      :class="{ last: index ===  content.length - 1}"
      :key="`${id}-content-${index}`"
      :position="verge.viewportH()"
    >
      <ArticleImg v-if="p.type === 'image'" :image="get(p, 'content.0')" class="innerImg" />
      <ArticleVideo v-else-if="p.type === 'video'" :id="`latest-${p.id}`"
        :video="get(p, 'content.0', {})" class="video" />
      <AudioBox v-else-if="p.type === 'audio'" :id="`latest-${p.id}`"
        :audio="get(p, 'content.0', {})" />
      <Slider v-else-if="p.type === 'slideshow'" class="per-slide"
        :option="sliderOption" :slideId="p.id">
        <template slot-scope="props">
          <swiper-slide :is="props.slide" v-for="(o, i) in get(p, 'content', [])" :key="`${i}-${Date.now()}`">
            <div>
              <div class="slideshowImg">
                <img :alt="get(o, 'description', '')"
                      :src="get(o, 'tablet', '')"
                      :srcset="`${get(o, 'mobile.url', '')} 800w,
                                  ${get(o, 'tablet.url', '')} 1200w`">
                <div class="img-caption" v-text="get(o, 'description', '')"></div>
              </div>
            </div>
          </swiper-slide>
        </template>
      </Slider>
      <div v-else-if="p.type === 'annotation'" class="content--annotation">
        <Annotation :annotationStr="get(p, 'content')" />
      </div>
      <div v-else v-html="paragraphComposer(p)" :style="{ backgroundColor: isBrief && bgcolor }"></div>
      <slot
        v-if="!isBrief && index === lastUnstyledParagraph - 1"
        name="relatedListInContent"
      />
      <p v-if="updatedAt && publishedDate && (index ===  content.length - 1) && showUpdatedTime" class="updated-time">更新時間｜
        <span>{{ moment(updatedAt).format('YYYY.MM.DD HH:mm') }}</span>
      </p>
      <!-- ADAR1 below 1st non-empty paragraph -->
      <div class="ad">
        <slot
          v-if="shouldShowADAR1 && index === nonEmptyParagraphsIndexs[0]"
          name="ADAR1"
        />
      </div>
      <!-- ADAR2 below 5th non-empty paragraph -->
      <div class="ad">
        <slot
          v-if="shouldShowADAR2 && index === nonEmptyParagraphsIndexs[4]"
          name="ADAR2"
        />
      </div>
    </div>
  </div>
</template>
<script>
  import { get, trim } from 'lodash'
  import Annotation from 'src/components/article/Annotation.vue'
  import ArticleImg from 'src/components/article/ArticleImg.vue'
  import AudioBox from 'src/components/AudioBox.vue'
  import ArticleVideo from 'src/components/article/Video.vue'
  // import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
  import Slider from '../Slider.vue'
  import moment from 'moment'
  import sanitizeHtml from 'sanitize-html'
  import uuidv4 from 'uuid/v4'
  import verge from 'verge'
  
  export default {
    name: 'ArticleBodyContent',
    components: {
      Annotation,
      AudioBox,
      ArticleImg,
      ArticleVideo,
      // LazyItemWrapper,
      Slider
    },
    computed: {
      nonEmptyParagraphsIndexs () {
        const isContentParagraph = obj => obj.type === 'unstyled' && obj.content.join('') !== ''
        return this.content
          // Preserve original index
          .map((d, i) => ({ index: i, type: d.type, content: d.content || [] }))
          .filter(obj => isContentParagraph(obj))
          .map(d => d.index)
      },
      shouldShowADAR1 () {
        return !this.isBrief && get(this.nonEmptyParagraphsIndexs, 0, -1) !== -1
      },
      shouldShowADAR2 () {
        return !this.isBrief && get(this.nonEmptyParagraphsIndexs, 4, -1) !== -1
      },
      lastUnstyledParagraph () {
        return get(this.nonEmptyParagraphsIndexs, this.nonEmptyParagraphsIndexs.length - 1, 0)
      },
      showUpdatedTime () {
        return moment(this.updatedAt).format('YYYY.MM.DD HH:mm') !== moment(this.publishedDate).format('YYYY.MM.DD HH:mm')
      }
    },
    data () {
      return {
        id: new uuidv4(),
        sliderOption: {
          initialSlide: 0,
          lazyLoadingInPrevNextAmount: 2,
          paginationable: false,
          paginationClickable: true,
          paginationHide: false,
          setNavBtn: true
        },
        verge 
      }
    },
    methods: {   
      get,
      moment,
      paragraphComposer (item) {
        switch (item.type) {
          case 'blockquote':
            return `<blockquote class="quote"><i class="quoteIcon"></i><div class="quote-content">${get(item.content, '0', '')}</div></blockquote>`
          case 'code-block':
            return `<div class="code">${get(item.content, [ 0 ], '')}</div>`
          case 'embeddedcode':
            return `<div class=\"embedded\ ${get(item.content, '0.alignment', '')}">${get(item.content, '0.embeddedCode', '')}<div class=\"caption\">${get(item.content, [ 0, 'caption' ], '')}</div></div>`
          case 'header-two':
            return `<h2>${item.content.toString()}</h2>`
          case 'infobox':
            return `<div class="info-box-container">
                      <span class="info-box-icon"></span>
                      <div class="info-box">
                        <div class="info-box-title">${get(item.content, '0.title', '')}</div>
                        <div class="info-box-body">${get(item.content, '0.body', '')}</div>
                      </div>
                    </div>`
          case 'ordered-list-item':
            const _liStrOrdered = item.content.map(i => (
              typeof i !== 'object' ? `<li>${i}</li>` : i.map(j => (`<li>${j}</li>`)).join('')
            )).join('')
            return `<ol class="${get(item, 'alignment', '')} ordered-list-item">${_liStrOrdered}</ol>`
          case 'quoteby':
            const quoteBy = get(item.content, '0.quoteBy', '')
            return `<blockquote class="blockquote">
                      <div class="content">
                        <span class="triangle"></span><div class="quote-body">${get(item.content, '0.quote', '').replace(/\n/g, '<br>')}</div>
                        ${(quoteBy.length > 0) ? `<div class="quote-by">${quoteBy}</div>` : ``}
                      </div>
                    </blockquote>`
          case 'unordered-list-item':
            const _liStrUnordered = item.content.map(i => (
              typeof i !== 'object' ? `<li>${i}</li>` : i.map(j => (`<li>${j}</li>`)).join('')
            )).join('')
            return `<ul class="${get(item, 'alignment', '')} unordered-list-item">${_liStrUnordered}</ul>`
          case 'unstyled':
            return trim(sanitizeHtml(item.content.join(''), { allowedTags: [] })).length > 0 ? `<p>${item.content.join('')}</p>` : ''

          case 'youtube':
            return `<div class=\"youtube\">
                      <div class=\"youtube-container\">
                        <iframe width=\"560\" alt=\"\" height=\"315\" src=\"https://www.youtube.com/embed/${get(item.content, '0.youtubeId', '')}\" frameborder=\"0\" allowfullscreen> </iframe>
                      </div>
                      <div class=\"caption\">${get(item.content, '0.description', '')}</div>
                    </div>`
          default:
            return
        }
      },        
    },
    mounted () {},
    props: {
      content: {
        default: () => []
      },
      isBrief: {
        default: false
      },
      bgcolor: {},
      publishedDate: {},
      updatedAt: {},
    },
  }
</script>
<style lang="stylus" scoped>
.content
  .content-item.last
    margin-bottom 30px
  >>> h2 
    color #000
    margin-top 40px
    padding 0 20px
  >>> .annotation
    padding 0 20px
  >>> p 
    color #171717
    font-size 18px
    line-height 36px
    margin 1.5em 0
    text-align justify
    padding 0 20px
  >>> .updated-time
    color #064f77
    font-size 1rem
    line-height 1.5
    span
      color #61a4cd
  
  >>> .youtube 
    clear both
    .youtube-container 
      align-items center
      display flex
      justify-content center
      margin 25px 0 5px
      padding-bottom 56.25%
      padding-top 25px
      position relative

      iframe 
        width 100%
        height 100%
        position absolute
        top 0
        left 0

    > .caption 
      font-family "Noto Sans TC", STHeitiTC-Medium, "Microsoft JhengHei", sans-serif
      font-size 15px
      line-height 1.7
      letter-spacing 0.3px
      color rgba(0, 0, 0, 0.498039)
      padding-top 10px
      padding-bottom 10px
              
  >>> .embedded 
    text-align center
    margin 1.5em auto
    clear both
    > div:not(.caption)
      margin 0 auto
    > .caption 
      font-family "Noto Sans TC", STHeitiTC-Medium, "Microsoft JhengHei", sans-serif
      font-size 15px
      line-height 1.7
      letter-spacing 0.3px
      color rgba(0, 0, 0, 0.498039)
      padding-top 10px
      padding-bottom 10px

    > iframe
      max-width 100%
      margin 0 auto

  >>> .audioBox
    width calc(100% - 40px)
    margin 0 auto
    padding 0

  >>> .video
    text-align center
    margin 1.5em auto
    clear both
    position relative

  >>> a
    &:hover, &:link, &:visited 
      color #3195b3
      text-decoration none
      cursor pointer
      border-bottom 1px solid #3195b3
      padding-bottom 5px
      
  >>> .code 
    line-height 2rem
    padding 0 20px
    margin 20px
  >>> blockquote.blockquote 
    clear both
    padding 0
    margin 70px 0
    padding 0 20px

    .content 
      border-top 3px solid #255577
      padding-top 20px
      padding-left 30px
      border-left 3px solid #255577
      font-size 24px
      color #3a759e

      .triangle::before
        content ''
        width 0
        height 0
        border-style solid
        border-width 50px 0 0 70px
        position relative
        top -70px
        left 30px
        display block
        border-color transparent transparent transparent #255577
      
      .triangle::after
        content ''
        width 0
        height 0
        border-style solid
        border-width 50px 0 0 70px
        position relative
        top -114px
        left 33px
        display block
        border-color transparent transparent transparent #ffffff
      
      .quote-body 
        margin-top -95px
        line-height 44px
      
      .quote-by 
            text-align right
            font-size 18px
            margin-top 18px

            &::before 
              content ''
              display inline-block
              height 100%
              vertical-align super
              width 36px
              margin-right 5px
              border-top 1px solid #3a759e
                  
  >>> blockquote.quote 
    clear both
    display flex
    margin 3em 0
    padding 0 20px

    i 
      background-image url(/assets/mirrormedia/icon/quote.png)
      width 45px
      height 45px
      background-repeat no-repeat
      background-size contain
      display block
      margin-right 20px
      max-width 45px
      flex 3
    
    .quoteIcon
      height 40px
      width 40px
      max-width 30px
      margin-top 8px
    .quote-content 
      line-height 2.1rem
      font-size 1.2rem
      color #3a759e
      flex 10
      text-align justify
        
      
  >>> .info-box-container 
    width 100%
    margin-bottom 3em

    .info-box-icon 
      &::before 
        content ''
        width 0
        height 0
        border-style solid
        border-width 12px 18px
        position relative
        left 0
        top 30px
        display block
        border-color #255577
      
      &::after 
        content ''
        width 0
        height 0
        border-style solid
        border-width 10px 0px 0px 18px
        position relative
        left 0
        top 30px
        display block
        border-color #7b7b7b transparent transparent transparent
      
    
    .info-box 
      border 1px solid #eaeaea
      padding 30px 24px
      box-shadow 0 0 14px rgba(146, 146, 146, 0.52)
      width 90%
      margin-top -35px
      margin-left 18px

      .info-box-body
        ol
          list-style decimal
        ul
          list-style disc
          text-indent 0
          line-height 2rem
          letter-spacing 0.05rem
          padding-left 0
          margin-left 1rem

          li
            overflow-wrap break-word

            &::before
              font-size 3rem
              top 1rem
              left 10px
          p, li 
            color rgba(0, 0, 0, 0.64)
            font-size 1rem
          
      .info-box-title 
        color #3a6888
        font-size 1.4rem
        margin-bottom 15px
    
  >>> h3 
    font-size 26px
  
  >>> ul 
    font-family "Noto Sans TC", STHeitiTC-Medium, "Microsoft JhengHei", sans-serif
    font-size 1rem
    line-height 2.2
    letter-spacing 0.3px
    color rgba(0, 0, 0, 0.701961)
    padding-left 45px
    // text-indent -26px
    margin-left 16px
    list-style none

    &.unordered-list-item
      li 
        &::before 
          content "• "
          color #2d5b7b
          font-size 30px
          line-height 1
          top 6px
          position relative

  >>> ol
    font-family "Noto Sans TC", STHeitiTC-Medium, "Microsoft JhengHei", sans-serif
    font-size 1rem
    line-height 2.2
    letter-spacing 0.3px
    color rgba(0, 0, 0, 0.701961)
    counter-reset item 0
    list-style none

    &.ordered-list-item
      li
        &::before
          content counter(item) ". "
          counter-increment item
          color #004ea2
          padding-left 10px
          padding-right 10px
          line-height 1


  >>> .swiper-wrapper 
    // height 450px
    display flex
    align-items center

    .swiper-slide 
      display flex
      align-items center
      justify-content center

      > div
        width 100%

      .slideshowImg 
        img 
          width 100%
          object-fit contain
          object-position center center
          max-height 450px

        .img-caption
          margin 10px auto 0
          padding 8px 0
          color rgba(0,0,0,0.498)
          font-size 1rem
          text-align left
          line-height 1.5rem
          padding 0 25px

.ad
  margin 20px 0

@media (min-width 400px)
  .content
    >>> p,   
    >>> h2,
    >>> blockquote.quote,
    >>> blockquote.blockquote,
    >>> .annotation,
    >>> .code 
      padding-right 40px
      padding-left 40px
    >>> .info-box-container
      width calc(100vw - 80px)
      margin-left auto
      margin-right auto
    >>> .embedded
      width calc(100vw - 40px)
    >>> .audioBox
      width calc(100% - 80px)

@media (min-width 499px)  
  .content     
    >>> .info-box-container
      .info-box
        width 95%
        padding 30px 50px
      .info-box-title
        font-size 1.5rem
</style>