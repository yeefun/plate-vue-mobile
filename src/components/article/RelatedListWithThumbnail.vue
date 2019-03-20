<template>
  <div class="related-container" v-if="relatedList.length > 0">
    <div class="related_title"><h3></h3></div>
    <div class="related_list">
      <div class="related_item" v-for="(o, i) in relatedList">
        <div>
          <a :href="`/story/${get(o, 'slug', '')}`" >
            <div class="related_item_img" :alt="get(o, 'title')"
                  :style="{ backgroundImage: `url(${getImage(get(o, 'heroImage'))})` }">
            </div>
          </a>
        </div>
        <div class="related_item_title">
          <a :href="`/story/${get(o, 'slug', '')}`" v-text="getTruncatedVal(o.title, 22)"></a>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import { getHref, getTruncatedVal } from 'src/util/comm'
  import { get } from 'lodash'
  
  export default {
    name: 'related-list-thumbnail',
    methods: {
      getHref,
      getTruncatedVal,
      get,
      getImage (id) {
        const item = this.$store.state.imagesById.find(image => image.id === id)
        const image = get(item, 'image.resizedTargets.mobile.url') || get(item, 'image.url')
        return image ? image : undefined
      },
    },
    props: {
      relatedList: {
        default: () => ([])
      }
    }
  }
</script>
<style lang="stylus">
  .related-container
    font-size 18px
    width 100%
    margin 0

    .related_title
      color #fff
    .related_list
      flex-direction column
      width 100%

      margin-top 10px
      display flex
      align-content center

      .related_item
        width 280px
        margin 30px auto
        
        vertical-align top
        box-shadow 3px 4px 15px rgba(0, 0, 0, 0.72)

        .related_item_img
          background-repeat no-repeat
          background-size cover
          background-position center center
          padding-top: 75%;


        .related_item_title
          background-color #fff
          border-left 7px solid rgba(140, 140, 140, 0.18)
          border-top-width 0
          line-height 18px
          font-size 1rem
          display flex
          justify-content center
          align-items center
          min-height 60px
          a
            width 95%
            max-height 100%
            margin 10px 20px
            &hover, &link, &visited
              color #8c8c8c
              font-weight normal
              border none

  @media (min-width 320px)
    .related-container
      .related_list
        .related_item
          width 320px
  @media (min-width 767px)
    .related-container
      .related_list
        .related_item
          width 31%
  
</style>
