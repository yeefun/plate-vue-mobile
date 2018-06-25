const moment = require('moment')
const { get } = require('lodash')

const getDate = (date) => {
  const normalizedDt = new Date(date)
  const datetime = moment(normalizedDt).format('YYYY.MM.DD HH:mm')
  return datetime
}

const getSectionColorModifier = (sectionId) => {
  const SECTION_MAP = {
    // news
    '57e1e0e5ee85930e00cad4e9': { 'sectionName': 'news', 'bgcolor': '#30bac8' },
    // entertainment
    '57e1e11cee85930e00cad4ea': { 'sectionName': 'entertainment', 'bgcolor': '#bf3284' },
    // businessmoney category-business-money
    '596441d04bbe120f002a319a': { 'sectionName': 'businessmoney', 'bgcolor': '#009045' },
    'category-business-money': { 'sectionName': 'businessmoney', 'bgcolor': '#009045' },
    // people
    '596441604bbe120f002a3197': { 'sectionName': 'people', 'bgcolor': '#efa256' },
    // videohub
    '5975ab2de531830d00e32b2f': { 'sectionName': 'videohub', 'bgcolor': '#969696' },
    // international
    '5964400d4bbe120f002a3191': { 'sectionName': 'international', 'bgcolor': '#911f27' },
    // foodtravel
    '57dfe399ee85930e00cad4d6': { 'sectionName': 'foodtravel', 'bgcolor': '#eac151' },
    // mafalda
    '5971aa8ce531830d00e32812': { 'sectionName': 'mafalda', 'bgcolor': '#662d8e' },
    // culture
    '5964418a4bbe120f002a3198': { 'sectionName': 'culture', 'bgcolor': '#009245' },
    // watch
    '57dfe3b0ee85930e00cad4d7': { 'sectionName': 'watch', 'bgcolor': '#c1d16e' },
    // external
    'external': { 'sectionName': 'external', 'bgcolor': '#ee5a24' }
  }
  return get(SECTION_MAP, [ sectionId, 'sectionName' ], '')
}

const getCredit = ({ cameraMan = [], designers = [], engineers = [], extendByline = '', photographers = [], writers = [] }) => {
  const creditWriterStr = (writers.length > 0) ? '文/' + writers.filter((o) => (o !== null && o !== undefined)).map((o) => (`<a href=\"/author/${o._id}\">${o.name}</a>`)).join('&nbsp;') : ''
  const creditPhotoStr = (photographers.length > 0) ? '攝影/' + photographers.filter((o) => (o !== null && o !== undefined)).map((o) => (`<a href=\"/author/${o._id}\">${o.name}</a>`)).join('&nbsp;') : ''
  const creditDesignStr = (designers.length > 0) ? '設計/' + designers.filter((o) => (o !== null && o !== undefined)).map((o) => (`<a href=\"/author/${o._id}\">${o.name}</a>`)).join('&nbsp;') : ''
  const creditEnginStr = (engineers.length > 0) ? '工程/' + engineers.filter((o) => (o !== null && o !== undefined)).map((o) => (`<a href=\"/author/${o._id}\">${o.name}</a>`)).join('&nbsp;') : ''
  const creditCamStr = (cameraMan.length > 0) ? '影音/' + cameraMan.filter((o) => (o !== null && o !== undefined)).map((o) => (`<a href=\"/author/${o._id}\">${o.name}</a>`)).join('&nbsp;') : ''
  const creditElse = (extendByline.length > 0) ? extendByline + '&nbsp;' : ''
  return [ creditWriterStr, creditPhotoStr, creditDesignStr, creditEnginStr, creditCamStr, creditElse ].filter((o) => (o.length > 0)).join('&nbsp;&nbsp;&nbsp;&nbsp;')
}

const getStoryHeroImageSrc = (heroImage) => {
  const dimensions = {
    desktop: get(heroImage, 'image.resizedTargets.desktop.url', get(heroImage, 'image.url', '/public/notImage.png')),
    tablet: get(heroImage, 'image.resizedTargets.tablet.url', get(heroImage, 'image.url', '/public/notImage.png')),
    mobile: get(heroImage, 'image.resizedTargets.mobile.url', get(heroImage, 'image.url', '/public/notImage.png')),
    tiny: get(heroImage, 'image.resizedTargets.tiny.url', get(heroImage, 'image.url', '/public/notImage.png')),
  }
  return get(dimensions, 'mobile')
}

const annotationTextTagStart = '<!--__ANNOTATION__='
const annotationTextTagEnd = '-->'
const hasAnnotation = (paragraph) => {
  const annotationContentStart = paragraph.toString().indexOf(annotationTextTagStart)
  const annotationContentEnd = paragraph.toString().indexOf(annotationTextTagEnd)

  return (annotationContentStart > -1 && annotationContentEnd > -1)
}

const composeAnnotation =  (annotationStr) => {
  const annotationContentStart = annotationStr.toString().indexOf(annotationTextTagStart)
  const annotationContentEnd = annotationStr.toString().indexOf(annotationTextTagEnd)

  const annotationContent = hasAnnotation(annotationStr) ? annotationStr.toString().substring(annotationContentStart + '<!--__ANNOTATION__='.length, annotationContentEnd) : '{}'

  const annotationContentObj = JSON.parse(annotationContent)

  let paragraph = annotationStr.toString()

  if (get(annotationContentObj, [ 'text' ])) {
    paragraph = paragraph.replace(`--><!--${annotationContentObj.text}-->`, '')
  }

  return {
    annotationPart1: annotationStr.toString().substring(0, annotationContentStart),
    annotationPart2: annotationContentObj.text,
    annotationPart3: hasAnnotation(paragraph.substring(annotationContentEnd)) ? composeAnnotation(paragraph.substring(annotationContentEnd)) : paragraph.substring(annotationContentEnd),
    annotationText: get(annotationContentObj, [ 'pureAnnotationText' ], '')
  }
}

module.exports = {
  getDate,
  getSectionColorModifier,
  getCredit,
  getStoryHeroImageSrc,
  composeAnnotation
}