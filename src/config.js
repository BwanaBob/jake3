module.exports = {
   axiosDefaultRequests: 300,
   axiosDefaultRequestsMS: 60000,
   readBehind: 120, // read data seconds before application started
   commentSize: 800,
   commentTitleSize: 65,
   modLogCommentSize: 65,
   modLogTitleSize: 65,
   modLogDescriptionSize: 240,
   postSize: 800,
   quietHours: {
      start: '23:10',
      end: '08:00',
   },
   redditChannelName: 'reddit',
   redditThreads: ['Jobs', 'Stream', 'Mod Log', 'Mod Mail', 'Mod Queue'], // threads each server must have to receive messages
   subreddits: {
      default: {
         discordServerId: '391821567241224192',
         notifyRole: '391837678967980035',
      },
      OnPatrolLive: {
         discordServerId: '325206992413130753',
         notifyRole: '1171955876609937564',
      },
      OnPatrolLiveTVShow: {
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
      BodycamCops: {
         discordServerId: '391821567241224192',
         notifyRole: '391837678967980035',
      },
      KillerCases: {
         discordServerId: '391821567241224192',
         notifyRole: '391837678967980035',
      },
      LAFireRescue: {
         discordServerId: '391821567241224192',
         notifyRole: '391837678967980035',
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
      modLog: { embedColor: '#cc44aa' },
      modMail: { embedColor: '#aa44cc' },
      modLogStats: { embedColor: '#3498db' },
      scheduleFast: { embedColor: '#3498db' },
      scheduleSlow: { embedColor: '#3498db' },
      blueSkyPostBingo: { embedColor: '#3498db' },
      blueSkyPostThread: { embedColor: '#e94e43' },
   },
   logger: {
      logLength: 140,
      dateLength: 23,
      color: '\x1b[33m%s\x1b[0m',
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
   jobs: {
      blueSkyPostBingo:{
         postText:"🚨 Hey #OPNation!\n#OnPatrolLive begins in one hour. Grab your bingo cards, play along, and try not to run afowl of the law!\n➡️ www.thatsabingo.com\n#OPLive #OnPatrolLive",
         singleImage: "./resources/bingo-splash-hen.png",
         imagePaths: [
            './resources/bingo-splash-chibi-shop.png',
            './resources/bingo-splash-easter-bunny.png',
            './resources/bingo-splash-leprechaun.png',
            './resources/bingo-splash-lucky.png',
            './resources/bingo-splash-spring-flowers.png',
         ]
      },
      blueSkyPostThread:{
         postText:"🚨 Greetings, #OPNation! We are one hour away from tonight's episode! Come join the live thread at r/OnPatrolLive and get your bingo cards.\n👉 reddit.com/r/OnPatrolLive\n#OPLive #Reddit",
         imagePath: './resources/reddit-live-thread.png'
      },
      getNewComments: {
         subreddit:
            'OnPatrolLive+Police247+LAFireandRescue+BodycamCops+KillerCases+OnPatrolLiveTVShow',
      },
      getNewPosts: {
         subreddit:
            'OnPatrolLive+Police247+LAFireandRescue+BodycamCops+KillerCases+OnPatrolLiveTVShow',
      },
      getNewModLog: {
         subreddit:
            'OnPatrolLive+Police247+LAFireandRescue+BodycamCops+KillerCases+OnPatrolLiveTVShow',
         actions: {
            banuser: { text: 'Ban User', enabled: true },
            unbanuser: { text: 'Unban User', enabled: true },
            spamlink: { text: 'Spam Link', enabled: true },
            removelink: { text: 'Remove Link', enabled: true },
            approvelink: { text: 'Approve Link', enabled: true },
            spamcomment: { text: 'Spam Comment', enabled: true },
            removecomment: { text: 'Remove Comment', enabled: true },
            approvecomment: { text: 'Approve Comment', enabled: true },
            addmoderator: { text: 'Add Moderator', enabled: true },
            showcomment: { text: 'Show Comment', enabled: true },
            invitemoderator: { text: 'Invite Moderator', enabled: true },
            uninvitemoderator: { text: 'Uninvite Moderator', enabled: true },
            acceptmoderatorinvite: {
               text: 'Accept Moderator Invite',
               enabled: true,
            },
            removemoderator: { text: 'Remove Moderator', enabled: true },
            addcontributor: { text: 'Add Contributor', enabled: true },
            removecontributor: { text: 'Remove Contributor', enabled: true },
            editsettings: { text: 'Edit Settings', enabled: true },
            editflair: { text: 'Edit Flair', enabled: true },
            distinguish: { text: 'Distinguish', enabled: true },
            marknsfw: { text: 'Mark NSFW', enabled: true },
            wikibanned: { text: 'Wiki Banned', enabled: true },
            wikicontributor: { text: 'Wiki Contributor', enabled: true },
            wikiunbanned: { text: 'Wiki Unbanned', enabled: true },
            wikipagelisted: { text: 'Wiki Page Listed', enabled: true },
            removewikicontributor: {
               text: 'Remove Wiki Contributor',
               enabled: true,
            },
            wikirevise: { text: 'Wiki Revise', enabled: true },
            wikipermlevel: { text: 'Wikipermlevel', enabled: true },
            ignorereports: { text: 'Ignorereports', enabled: true },
            unignorereports: { text: 'Unignorereports', enabled: true },
            setpermissions: { text: 'Setpermissions', enabled: true },
            setsuggestedsort: { text: 'Setsuggestedsort', enabled: true },
            sticky: { text: 'Sticky', enabled: true },
            unsticky: { text: 'Unsticky', enabled: true },
            setcontestmode: { text: 'Set Contest Mode', enabled: true },
            unsetcontestmode: { text: 'Unset Contest Mode', enabled: true },
            lock: { text: 'Lock', enabled: true },
            unlock: { text: 'Unlock', enabled: true },
            muteuser: { text: 'Mute User', enabled: true },
            unmuteuser: { text: 'Unmute User', enabled: true },
            createrule: { text: 'Create Rule', enabled: true },
            editrule: { text: 'Edit Rule', enabled: true },
            reorderrules: { text: 'Reorder Rules', enabled: true },
            deleterule: { text: 'Delete Rule', enabled: true },
            spoiler: { text: 'Spoiler', enabled: true },
            unspoiler: { text: 'Unspoiler', enabled: true },
            modmail_enrollment: { text: 'Modmail Enrollment', enabled: true },
            community_status: { text: 'Community Status', enabled: true },
            community_styling: { text: 'Community Styling', enabled: true },
            community_welcome_page: {
               text: 'Community Welcome Page',
               enabled: true,
            },
            community_widgets: { text: 'Community Widgets', enabled: true },
            markoriginalcontent: {
               text: 'Mark Original Content',
               enabled: true,
            },
            collections: { text: 'Collections', enabled: true },
            events: { text: 'Events', enabled: true },
            hidden_award: { text: 'Hidden Award', enabled: true },
            add_community_topics: {
               text: 'Add Community Topics',
               enabled: true,
            },
            remove_community_topics: {
               text: 'Remove Community Topics',
               enabled: true,
            },
            create_scheduled_post: {
               text: 'Create Scheduled Post',
               enabled: true,
            },
            edit_scheduled_post: { text: 'Edit Scheduled Post', enabled: true },
            delete_scheduled_post: {
               text: 'Delete Scheduled Post',
               enabled: true,
            },
            submit_scheduled_post: {
               text: 'Submit Scheduled Post',
               enabled: true,
            },
            edit_comment_requirements: {
               text: 'Edit Comment Requirements',
               enabled: true,
            },
            edit_post_requirements: {
               text: 'Edit Post Requirements',
               enabled: true,
            },
            invitesubscriber: { text: 'Invite Subscriber', enabled: true },
            submit_content_rating_survey: {
               text: 'Submit Content Rating Survey',
               enabled: true,
            },
            adjust_post_crowd_control_level: {
               text: 'Adjust Post Crowd Control Level',
               enabled: true,
            },
            enable_post_crowd_control_filter: {
               text: 'Enable Post Crowd Control Filter',
               enabled: true,
            },
            disable_post_crowd_control_filter: {
               text: 'Disable Post Crowd Control Filter',
               enabled: true,
            },
            deleteoverriddenclassification: {
               text: 'Delete Overridden Classification',
               enabled: true,
            },
            overrideclassification: {
               text: 'Override Classification',
               enabled: true,
            },
            reordermoderators: { text: 'Reorder Moderators', enabled: false },
            snoozereports: { text: 'Snooze Reports', enabled: true },
            unsnoozereports: { text: 'Unsnooze Reports', enabled: true },
            addnote: { text: 'Add Note', enabled: true },
            deletenote: { text: 'Delete Note', enabled: true },
            addremovalreason: { text: 'Add Removal Reason', enabled: true },
            createremovalreason: {
               text: 'Create Removal Reason',
               enabled: true,
            },
            updateremovalreason: {
               text: 'Update Removal Reason',
               enabled: true,
            },
            deleteremovalreason: {
               text: 'Delete Removal Reason',
               enabled: true,
            },
            reorderremovalreason: {
               text: 'Reorder Removal Reason',
               enabled: true,
            },
            dev_platform_app_changed: {
               text: 'Dev Platform App Changed',
               enabled: true,
            },
            dev_platform_app_disabled: {
               text: 'Dev Platform App Disabled',
               enabled: true,
            },
            dev_platform_app_enabled: {
               text: 'Dev Platform App Enabled',
               enabled: true,
            },
            dev_platform_app_installed: {
               text: 'Dev Platform App Installed',
               enabled: true,
            },
            dev_platform_app_uninstalled: {
               text: 'Dev Platform App Uninstalled',
               enabled: true,
            },
            edit_saved_response: { text: 'Edit Saved Response', enabled: true },
            chat_approve_message: {
               text: 'Chat Approve Message',
               enabled: true,
            },
            chat_remove_message: { text: 'Chat Remove Message', enabled: true },
            chat_ban_user: { text: 'Chat Ban User', enabled: true },
            chat_unban_user: { text: 'Chat Unban User', enabled: true },
            chat_invite_host: { text: 'Chat Invite Host', enabled: true },
            chat_remove_host: { text: 'Chat Remove Host', enabled: true },
            approve_award: { text: 'Approve Award', enabled: true },
         },
      },
      getNewModQueue: {
         subreddit:
            'OnPatrolLive+Police247+LAFireandRescue+BodycamCops+KillerCases+OnPatrolLiveTVShow',
      },
      getTempBans: {
         subreddit: 'OnPatrolLive',
      },
      getUnusedFlairs: {
         subreddit: 'OnPatrolLive',
      },
      getCotNFlairs: {
         subreddit: 'OnPatrolLiveTVShow',
      },
      getFlairUsage: {
         subreddit: 'OnPatrolLive',
      },
      tidy: {
         subreddit: 'OnPatrolLive',          // subreddit to search
         searchString: 'Live Thread',        // Post title to locate
         searchSize: 20,                     // How many posts to return in search
         searchFlairName: 'Live Thread',     // Post flair to locate and change
         targetFlairName: 'Past Live Thread' // Post flair to change to
      },
      getNewModMail: {
         subreddit:
            'OnPatrolLive+Police247+LAFireandRescue+BodycamCops+KillerCases+OnPatrolLiveTVShow',
      },
      getModLogStats: {
         subreddit: 'OnPatrolLive',
         startDate: '2024-07-19',
         startTime: '18:00:00',
         endDate: '2024-07-21',
         endTime: '00:30:00',
      },
      getTopComments: {
         subreddit: 'OnPatrolLive',
         searchMode: 'latest', // 'latest', 'date' or 'id'
         // searchString: '1bwvw9r',
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
            'MjolnirHammertime',
         ],
      },
   },
}
