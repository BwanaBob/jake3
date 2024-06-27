module.exports = {
   axiosDefaultRequests: 300,
   axiosDefaultRequestsMS: 60000,
   readBehind: 90, // read data seconds before application started
   commentSize: 800,
   postSize: 800,
   quietHours: {
      start: '23:10',
      end: '08:00',
   },
   redditChannelName: 'reddit',
   redditThreads: ['Jobs', 'Stream', 'Mod Mail', 'Mod Queue'], // threads each server must have to receive messages
   subreddits: {
      default: {
         discordServerId: '391821567241224192',
         notifyRole: '391837678967980035',
      },
      OnPatrolLive: {
         discordServerId: '325206992413130753',
         notifyRole: '1171955876609937564',
      },
      OPLTesting: {
         discordServerId: '391821567241224192',
         notifyRole: '391837678967980035',
      },
      Police247: {
         discordServerId: '1239702141401305109',
         notifyRole: '1255242494870945904',
      },
      LAFireandRescue: {
         discordServerId: '1119328833250803806',
         notifyRole: '1255723797290418328',
      },
   },
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
      subreddit: 'OnPatrolLive',
      searchString: 'title:"Live Thread"',
      returnCount: 10, // number of top comments to return
      commentLimit: 100, // Comments per fetch to analize
      fetchCount: 5, // repeat fetches to get average score
      fetchDelay: 2000, // delay between repeated fetches
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
   getModLogJob: {
      subreddit: "OnPatrolLive",
      startDate: "2024-06-02",
      startTime: "18:00:00",
      endDate: "2024-06-25",
      endTime: "18:00:00",
   },
}
