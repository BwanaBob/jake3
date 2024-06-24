module.exports = {
   axiosDefaultRequests: 60,
   axiosDefaultRequestsMS: 60000,
   readBehind: 60, // read data seconds before application started
   commentSize: 800,
   postSize: 800,
   jobOutput: {
      tidy: { embedColor: '#3498db' },
      cotn: { embedColor: '#3498db' },
      newComment: { embedColor: '#3498db' },
      spamComment: { embedColor: '#e91e63' },
      modQueueComment: { embedColor: '#f1c40f' },
      reportedComment: { embedColor: '#c40ff1' },
      newPost: { embedColor: '#2ecc71' },
      spamPost: { embedColor: '#e91e63' },
      modQueuePost: { embedColor: '#f1aa0f' },
      reportedPost: { embedColor: '#c40ff1' },
      modMail: { embedColor: '#aa44cc' },
   },
   logger: {
      logLength: 140,
      dateLength: 23,
      columns: {
         0: { min: 12, max: 12 },
         1: { min: 15, max: 15 },
         2: { min: 15, max: 15 },
         3: { min: 15, max: 15 },
         4: { min: 15, max: 15 },
         5: { min: 15, max: 15 },
         6: { min: 15, max: 15 },
         7: { min: 15, max: 15 },
         8: { min: 15, max: 15 },
         9: { min: 15, max: 15 },
         10: { min: 15, max: 15 },
         11: { min: 15, max: 15 },
         12: { min: 15, max: 15 },
         13: { min: 15, max: 15 },
         14: { min: 15, max: 15 },
      },
   },
   cotn: {
      subreddit: "OnPatrolLive",
      searchString: 'title:"Live Thread"',
      returnCount: 10,    // number of top comments to return
      commentLimit: 100,  // Comments per fetch to analize
      fetchCount: 5,      // repeat fetches to get average score
      fetchDelay: 2000,   // delay between repeated fetches
      ineligibleUsers: [
         'meet_me_at_the_barre',
         'BwanaRob',
         'sausageslinger11',
         'ifreakinglovepancake',
         'aeiouaeiou999999',
         'Moretakitty',
         'EremiticFerret',
         'Kavzilla',
         'HatchlingChibi',
         'LydiaTheTattooedLady',
         'BizarroRick',
      ],
   },
}
