/**
 * Config
 */

const package = require('../package.json');

const resolve = require(`${process.env.PWD}/node_modules/@nycopportunity/pttrn/bin/util/resolve`);
const global = resolve('config/global', true, false);
const tokens = resolve('config/tokens', true, false); // The third param of the resolve utility prevents the tokens file from being cached
const tailwindcss = resolve('config/tailwindcss', true, false);

/**
 * Config
 */

module.exports = {
  /**
   * Configuration
   */
  src: 'src',
  views: 'views',
  dist: 'dist',
  globs: [
    `${process.env.PWD}/config/slm.js`,
    `${process.env.PWD}/src/**/*.slm`,
    `${process.env.PWD}/src/**/*.md`,
    `${process.env.PWD}/node_modules/@nycopportunity/**/*.slm`,
    `${process.env.PWD}/node_modules/@nycopportunity/**/*.md`
  ],
  marked: {
    gfm: true,
    headerIds: true,
    headerPrefix: '',
    smartypants: true
  },
  beautify: {
    indent_size: 2,
    indent_char: ' ',
    preserve_newlines: false,
    indent_inner_html: false,
    wrap_line_length: 0,
    inline: [],
    indent_inner_html: false,
  },

  /**
   * Package Variables
   */
  package: package,
  global: global,
  tokens: tokens,
  tailwindcss: tailwindcss,
  process: {
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  },
  baseUrl: (process.env.NODE_ENV === 'production') ? package.homepage : '',
  urls: {
    tailwindDocs: 'https://tailwindcss.com/docs/'
  },
  links: {
    nycopportunity: {
      homepage: 'http://nyc.gov/opportunity',
      social: {
        github: 'https://github.com/nycopportunity',
        twitter:  'https://twitter.com/nycopportunity',
        facebook: 'https://www.facebook.com/nycopportunity',
        instagram: 'https://www.instagram.com/nycopportunity'
      }
    }
  },

  // /**
  //  * Newsletter Data
  //  *
  //  * @type {Array}
  //  */
  // newsletter: {
  //   action: 'https://nyc.us18.list-manage.com/subscribe/post?u=d04b7b607bddbd338b416fa89&id=aa67394696',
  //   boroughs: [
  //     {
  //       id: 'mce-group[4369]-4369-0',
  //       name: 'group[4369][1]',
  //       value: '1',
  //       label: 'Bronx',
  //       class: 'mb-0'
  //     },
  //     {
  //       id: 'mce-group[4369]-4369-4',
  //       name: 'group[4369][16]',
  //       value: '16',
  //       label: 'Staten Island',
  //       class: 'mb-0'
  //     },
  //     {
  //       id: 'mce-group[4369]-4369-3',
  //       name: 'group[4369][8]',
  //       value: '8',
  //       label: 'Queens',
  //       class: 'mb-0'
  //     },
  //     {
  //       id: 'mce-group[4369]-4369-1',
  //       name: 'group[4369][2]',
  //       value: '2',
  //       label: 'Brooklyn',
  //       class: 'mb-0'
  //     },
  //     {
  //       id: 'mce-group[4369]-4369-2',
  //       name: 'group[4369][4]',
  //       value: '4',
  //       label: 'Manhattan',
  //       class: 'mb-0'
  //     }
  //   ]
  // },

  /**
   * Sample Programs
   *
   * @type {Array}
   */
  programs: [
    {
      title: 'Training to become a commercial driver',
      subtitle: '<b>Red Hook on the Road</b> by NYC Small Business Services (SBS)',
      url: 'https://working.nyc.gov/programs/red-hook-on-the-road/',
      status: [
        // {
        //   status: 'Recruiting',
        //   type: 'text',
        //   label: 'Not Actively Recruiting'
        // },
        {
          status: 'Recruiting',
          type: 'badge',
          label: 'Actively Recruiting'
        },
        {
          status: 'Disability information',
          type: 'icon',
          icon: 'icon-nyco-accessible',
          label: 'Disability accommodation details are available. View this program to learn more.'
        },
        {
          status: 'Language information',
          type: 'icon',
          icon: 'icon-nyco-translate',
          label: 'Language access details are available. View this program to learn more.'
        },
      ],
      summary: `
        <p>This program prepares unemployed New Yorkers to work as commercial drivers.
        For <b class="text-em">Adults</b>, <b class="text-em">Low-income New Yorkers</b>,
        <b class="text-em">Public assistance recipients</b>,
        <b class="text-em">People with justice involvement</b>.</p>`,
      features: [
        {
          feature: 'Services',
          icon: 'feather-award',
          title: 'Services Provided',
          label: 'Training for a new job'
        },
        {
          feature: 'Schedule',
          icon: 'feather-calendar',
          title: 'Duration and Length',
          label: '1 to less than 3 months. Daytime, Full-time'
        }
      ],
      cta: 'Learn more'
    },
    {
      title: 'Money to buy food',
      subtitle: `
        <b>Supplemental Nutrition Assistance Program (SNAP)</b> by NYC Human
        Resources Administration (HRA)`,
      url: 'https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/',
      icon: {
        icon: 'program-card-cash-expenses',
        title: 'Cash & Expenses'
      },
      summary: `
        <p>SNAP benefits can help you feed your family with fresh and healthy
        groceries. For <b class="text-em">Everyone</b>.</p>`,
      features: [
        {
          feature: 'Services',
          icon: 'feather-shopping-cart',
          title: 'Services Provided',
          label: 'Cash & Expenses, Food.'
        }
      ],
      cta: 'Learn more'
    }
  ],

  // /**
  //  * Survey Questions
  //  *
  //  * @type {Array}
  //  */
  // survey: [
  //   {
  //     legend: 'Population',
  //     options: [
  //       {label: 'You’re between 16 and 24 years old'},
  //       {label: 'You’re over 55 years old'},
  //       {label: 'You’re an immigrant'},
  //       {label: 'You live in NYCHA housing'},
  //       {label: 'You have a disability '},
  //       {label: 'You’ve been impacted by the justice system'},
  //       {label: 'You get public assistance'},
  //       {label: 'You’re unemployed or have a low income'},
  //       {label: 'You’re an adult age 18+'},
  //       {label: 'You’re not sure'}
  //     ]
  //   },
  //   {
  //     legend: 'Services',
  //     options: [
  //       {label: 'Skills for a new job or career'},     // Training for a new career
  //       {label: 'Help applying for jobs'},             // Help applying for work
  //       {label: 'An internship or short-term job'},    // Internship and short-term work
  //       {label: 'Your high school equivalency (GED)'}, // High school equivalency (GED) prep
  //       {label: 'Better English language skills'},     // English language learning
  //       {label: 'I\'m not sure'}
  //     ]
  //   },
  //   {
  //     legend: 'Schedule',
  //     options: [
  //       {label: 'Daytime'},
  //       {label: 'Evening'},
  //       {label: 'Weekend'},
  //       {label: 'Part-time'},
  //       {label: 'Full-time'},
  //       {label: 'You need a flexible schedule'},
  //       {label: 'You’re not sure'}
  //     ]
  //   }
  // ],

  // /**
  //  * Program Filters
  //  *
  //  * @type {Array}
  //  */
  // filters: [
  //   {
  //     legend: 'Services',
  //     options: [
  //       {label: 'Training for a new career'},
  //       {label: 'Help applying for work'},
  //       {label: 'Internship and short-term work'},
  //       {label: 'High school equivalency (GED) prep'},
  //       {label: 'English language learning'}
  //       // {label: 'Job training'},
  //       // {label: 'Job certification'},
  //       // {label: 'Job prep'},
  //       // {label: 'Paid work'},
  //       // {label: 'Job placement'},
  //       // {label: 'Skill building'},
  //       // {label: 'HSE prep'},
  //       // {label: 'English language learning'}
  //     ]
  //   },
  //   // {
  //   //   legend: 'Sectors',
  //   //   options: [
  //   //     {label: 'Transportation'},
  //   //     {label: 'Health care'},
  //   //     {label: 'Construction'},
  //   //     {label: 'Restaurant'},
  //   //     {label: 'Human resources'},
  //   //     {label: 'Marketing'},
  //   //     {label: 'Media'},
  //   //     {label: 'Security'},
  //   //     {label: 'Technology'},
  //   //     {label: 'Arts'},
  //   //     {label: 'Salon services'},
  //   //     {label: 'IT infrastructure'},
  //   //     {label: 'Manufacturing'}
  //   //   ]
  //   // },
  //   {
  //     legend: 'Population',
  //     options: [
  //       {label: 'Young adults (16–24)'},
  //       {label: 'Adults (18+)'},
  //       {label: 'Older adults (55+)'},
  //       {label: 'Immigrant New Yorker'},
  //       {label: 'NYCHA residents'},
  //       {label: 'People with disabilities'},
  //       {label: 'People with justice involvement'},
  //       {label: 'Public assistance recipients'},
  //       {label: 'Low-income New Yorker'},
  //       // {label: 'Adults (18+)'},
  //       // {label: 'Youth (16–24)'},
  //       // {label: 'Immigrant New Yorkers'},
  //       // {label: 'Unemployed New Yorkers'},
  //       // {label: 'Low-income New Yorkers'},
  //       // {label: 'Seniors (55+)'},
  //       // {label: 'NYCHA residents'},
  //       // {label: 'People with disabilities'},
  //       // {label: 'Veterans'}
  //     ]
  //   },
  //   {
  //     legend: 'Schedule',
  //     options: [
  //       {label: 'Daytime'},
  //       {label: 'Evening'},
  //       {label: 'Weekend'},
  //       {label: 'Part-time'},
  //       {label: 'Full-time'},
  //       {label: 'Flexible'}
  //       // {label: 'Full-time'},
  //       // {label: 'Night classes'},
  //       // {label: 'Weekends'},
  //       // {label: 'Flexible'},
  //       // {label: 'Varies'}
  //     ]
  //   },
  //   // {
  //   //   legend: 'Location',
  //   //   options: [
  //   //     {label: 'Brooklyn'},
  //   //     {label: 'Bronx'},
  //   //     {label: 'Manhattan'},
  //   //     {label: 'Queens'},
  //   //     {label: 'Staten Island'},
  //   //     {label: 'Virtual'}
  //   //   ]
  //   // }
  // ],

  /**
   * Announcements Content
   *
   * @type {Array}
   */
  announcements: [
    {
      badge: 'New',
      title: 'Receive text messages with new job openings',
      url: 'https://www1.nyc.gov/site/businesslink/contact/txt-2-work.page',
      summary: `<p>"TXT-2-WORK" sends you personalized text messages with openings in high-demand industries like maintenance, retail, and customer service. <a href="https://www1.nyc.gov/site/businesslink/contact/txt-2-work.page" target="_blank" rel="noopener">Sign up online</a> or text "<strong>NYJOBS</strong>" or "<strong>NYCJOBS</strong>"&nbsp;to&nbsp;<a href="sms:91908" target="_blank" rel="noopener noreferrer">91908</a>. Learn more about this program on <a href="https://access.nyc.gov/programs/text-2-work/" target="_blank" rel="noopener">ACCESS NYC</a>.</p>`,
      features: [
        {
          feature: 'Last Updated',
          icon: 'feather-info',
          label: 'Updated February 15, 2022 11:10 am'
        }
      ],
      external: true,
      webShare: true
    },
    {
      title: `
        Get no-cost or low-cost healthcare
        <svg aria-hidden="true" class="icon-nyco-ui rtl:flip">
          <use href="#feather-external-link"></use>
        </svg>
      `,
      url: '/demos/news/#',
      summary: '<p>Available to those who don\'t qualify for government-sponsored health insurance.</p>',
      features: [
        {
          feature: 'Last Updated',
          icon: 'feather-alert-triangle',
          text: '<span>Posted Tuesday, November 24th, 10:39am</span>'
        }
      ],
      webShare: true
    },
    // {
    //   title: `
    //     Help Avoiding Eviction
    //     <svg aria-hidden="true" class="icon-nyco-ui rtl:flip">
    //       <use href="#feather-external-link"></use>
    //     </svg>
    //   `,
    //   url: '/demos/news/#',
    //   summary: '<p>Available regardless of immigration status.</p>',
    //   features: [
    //     {
    //       feature: 'Last Updated',
    //       icon: 'feather-alert-triangle',
    //       text: '<span>Posted Tuesday, November 24th, 10:39am</span>'
    //     }
    //   ],
    //   webShare: true
    // },
    // {
    //   title: `
    //     Low-cost and free health insurance
    //     <svg aria-hidden="true" class="icon-nyco-ui rtl:flip">
    //       <use href="#feather-external-link"></use>
    //     </svg>
    //   `,
    //   url: '/demos/news/#',
    //   summary: '<p>Open enrollment through the New York State of Health is from November 1, 2020 to January 31, 2021.</p>',
    //   features: [
    //     {
    //       feature: 'Last Updated',
    //       icon: 'feather-alert-triangle',
    //       text: '<span>Posted Tuesday, November 24th, 10:39am</span>'
    //     }
    //   ],
    //   webShare: true
    // }
  ],

  accordions: [
    {
      groups: [
        {
          title: 'Apply online',
          body: `
            <ol>
              <li>Apply online using <a href="https://a069-access.nyc.gov/ACCESSNYC/application.do" target="_blank" rel="noopener noreferrer" tabindex="-1">ACCESS HRA</a>. You can apply for Cash Assistance, SNAP, and Medicaid Renewal <strong>all</strong> at the same time.</li>
              <li>Scan your documents using the NYC HRA Document Upload app available for free on the <a href="https://appsto.re/us/9s9N_.i" target="_blank" rel="noopener noreferrer" tabindex="-1">iTunes Store</a> (for iPhones) or the <a href="https://play.google.com/store/apps/details?id=gov.nyc.hra.DocUploads" target="_blank" rel="noopener noreferrer" tabindex="-1">Google Play Store</a> (for Android phones).</li>
              <li>After you submit your application, you will be contacted to do an eligibility interview. You can do your interview over the telephone without having to come into a SNAP center.</li>
              <li>You can check the status of your application by going to <a href="https://a069-access.nyc.gov/ACCESSNYC/application.do" target="_blank" rel="noopener noreferrer" tabindex="-1">ACCESS HRA</a>.</li>
              <li>You will need to recertify for SNAP once every year. The SNAP office will mail you a recertification packet for you to complete and mail back to HRA or recertify online on ACCESS HRA. Once you submit your recertification, you will be able to set up your preferred interview date and time by calling the On Demand interview phone line at <a href="tel:718-762-7669" tabindex="-1">718-SNAP-Now</a> (<a href="tel:718-762-7669" tabindex="-1">718-762-7669</a>).</li>
            </ol>

            <p class="print:hidden">
              <a class="btn btn-secondary btn-next" href="https://a069-access.nyc.gov/ACCESSNYC/application.do" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <span>Apply online</span>

                <svg aria-hidden="true" class="icon-ui rtl:flip" tabindex="-1">
                  <use href="#feather-external-link"></use>
                </svg>
              </a>
            </p>
          `
        },
        {
          title: 'Apply by mail',
          body: `
            <ol>
              <li>Print a <a href="http://otda.ny.gov/programs/applications/4826.pdf" target="_blank" rel="noopener noreferrer" tabindex="-1">paper application</a>, pick one up from a <a href="https://www1.nyc.gov/site/hra/locations/snap-locations.page" target="_blank" rel="noopener noreferrer" tabindex="-1">SNAP Center</a>, or call the HRA Infoline at <a href="tel:718-557-1399" target="_blank" rel="noopener noreferrer" tabindex="-1">718-557-1399</a> to have a paper application mailed to you.</li>
              <li>Mail the application and copies of your documents to:<br>
                <strong>Division of SNAP Services, Mail Application &amp; Referral Unit (MARU)</strong><br>
                P.O. Box 24510<br>
                Brooklyn, NY, 11201</li>
            </ol>

            <p class="print:hidden">
              <a class="btn btn-secondary btn-next" href="http://otda.ny.gov/programs/applications/4826.pdf" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <span>Download the form</span>

                <svg aria-hidden="true" class="icon-ui rtl:flip" tabindex="-1">
                  <use href="#feather-external-link"></use>
                </svg>
              </a>
            </p>
          `
        },
        {
          title: 'Apply in person',
          body: `
          <ol>
            <li>Print a <a href="http://otda.ny.gov/programs/applications/4826.pdf" target="_blank" rel="noopener noreferrer" tabindex="-1">paper application</a>, pick one up from a <a href="https://www1.nyc.gov/site/hra/locations/snap-locations.page" target="_blank" rel="noopener noreferrer" tabindex="-1">SNAP Center</a>, or call the HRA Infoline at <a href="tel:718-557-1399" target="_blank" rel="noopener noreferrer" tabindex="-1">718-557-1399</a> to have a paper application mailed to you.</li>
            <li>Gather the documents you’ll need to include with your application.</li>
            <li>Drop off your completed application at a <a href="https://www1.nyc.gov/site/hra/locations/snap-locations.page" target="_blank" rel="noopener noreferrer" tabindex="-1">SNAP Center</a> near you. You can make copies of your documents at the center.</li>
            <li>You can also apply for SNAP at a <a href="https://www1.nyc.gov/site/hra/partners/find-a-partner-organization.page" target="_blank" rel="noopener noreferrer" tabindex="-1">community-based organization (CBO) in your neighborhood</a>. Experts can help you submit your application and the necessary documents.</li>
          </ol>

          <p class="print:hidden">
            <a class="btn btn-secondary btn-next" href="https://www1.nyc.gov/site/hra/locations/snap-locations.page" target="_blank" rel="noopener noreferrer" tabindex="-1">
              <span>Find a location</span>

              <svg aria-hidden="true" class="icon-ui rtl:flip" tabindex="-1">
                <use href="#feather-external-link"></use>
              </svg>
            </a>
          </p>
          `
        }
      ]
    }
  ],

  /**
   * Functions
   */
  createId: () => Math.random().toString(16).substring(2),
  createSlug: (s) => s.toLowerCase().replace(/[^0-9a-zA-Z - _]+/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
};
