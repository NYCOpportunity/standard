
At NYC Opportunity, we believe government services should be:

* Created with the people who use and deliver them
* Equitably distributed
* Prototyped and tested for usability
* Rigorously tested and evaluated for effectiveness and impact
* Accessible to all

This is the foundation on which we build and deliver all of our digital products. The {{ this.package.nice }} is built with these principles in mind to make our products accessible for design and development teams internally and externally for peers in the field.

## Development

ACCESS NYC was relaunched in 2017 to address the barriers New Yorkers face when trying to seek information about or apply for benefits. This involved an iterative prototyping process that engaged residents, social workers, case managers, and government agency staff to deliver a new design and core user experience. The user interface started with the [U.S. Web Design System](https://designsystem.digital.gov/) as a boilerplate for UI Elements and WCAG AA compliance. It was extended for New York City residents by including support for seven different languages with RTL and LTR reading orientations.

Learn more about the initial launch of ACCESS NYC through these two case studies:

* [Case Study: ACCESS NYC 1](https://civicservicedesign.com/case-study-access-nyc-part-1-5ccdf1c4a520)
* [Case Study: ACCESS NYC 2](https://civicservicedesign.com/case-study-access-nyc-part-2-f86130ebdead)

In late summer of 2017, NYC Opportunity and the Mayor’s Public Engagement Unit (PEU) began designing, developing, and testing a version of the ACCESS NYC Eligibility benefits screener optimized for their Outreach Specialists. This process involved taking the core user interface elements of ACCESS NYC and repurposing them for the outreach specialist with a nuanced and advanced understanding of enrolling New Yorkers in benefits.

[Learn more about the NYC Opportunity and Public Engagement Unit partnership in this article](https://medium.com/nyc-opportunity/nyc-opportunity-and-the-public-engagement-unit-partner-for-facilitated-benefits-screening-and-e889407ccf4c).

During the development of the PEU Screener, the Product and Design teams were tasked with replatforming the ACCESS NYC interface, but there was no common language or easily accessible documentation for the designers and developers to reference. This realization highlighted the need to formalize the ACCESS NYC interface and Service Design Studio principles into a Design System.

## Design Systems

##### “A design system is a set of interconnected patterns and shared practices coherently organized to achieve the purpose of digital products.” [_- Alla Kholmatova, Design Systems; A practical guide to creating design languages for digital products_](http://designsystemsbook.com)

To further the purpose of ACCESS NYC as a digital product, we realized the need to create and document the Patterns used to create it. As our practice develops we will be able to utilize the Patterns conventions and documentation as a starting point for understanding.

### Naming Convention

The first step we took to creating the Patterns was to perform an audit of the existing ACCESS NYC modules and grouped them according to a naming convention influenced by “[BEMIT: Taking the BEM Naming Convention a Step Further](https://csswizardry.com/2015/08/bemit-taking-the-bem-naming-convention-a-step-further/).” Our four buckets included Elements, Components, Objects, and Utilities. If you are familiar with Brad Frost’s [Atomic Design Methodology](http://atomicdesign.bradfrost.com/chapter-2/), this structure will sound very familiar. As a team we picked names that resonated with us for each of the Patterns and assigned them to each group. The hope is that developing a common language will enable us work together more effectively to focus on the users we are serve.

![Image with graphics representing elements, components, and objects.](images/naming-01.png "Elements, Components, and Objects")

#### Elements

Element Patterns are the most primitive building blocks of a web page. They include some of the most standard HTML tags such as links, buttons, lists, and tables. They do not have complicated markup or any dependencies on other modules.

#### Components

Component Patterns are more complicated modules that may contain one or more Elements, complex markup, styling, or JavaScript dependencies. They are often repeated within a view.

#### Objects

Object Patterns contain the most complicated markup-specific styling. They may contain one or more Elements or Components. Objects generally do not repeat within a view but they may be globally visible across different views.

![Image with graphic describing how elements fit into components and components fit into objects.](images/naming-02.png "How Elements, Components, and Objects Fit Together")

#### Utilities

Utilities are single-purpose classes that allow teams to change specific styling features of Elements, Components, and Objects. For the ACCESS NYC Patterns we are leveraging [Tailwind CSS](https://tailwindcss.com). By using utilities, the design system becomes far more flexible.

![Image with graphic describing how utilities can change the styling of an element.](images/naming-03.png "Utilities")

## Working NYC

Working NYC was created by the Mayor’s Office of Talent and Workforce Development in collaboration with the Mayor’s Office for Economic Opportunity. It was developed through a user-centered and iterative process with input from City agencies, provider organizations, and the New Yorkers it aims to serve. Version 1 of the site launched in August 2020. The team continues to maintain Working NYC as a resource created for and by City residents. Since then, we’ve shipped many technical improvements to the site, including advanced search engine optimization, inclusive design patterns, and accessibility enhancements. Our content and feature development combine quantitative and qualitative insights, such as customer feedback forms, website analytics monitoring, and usability interviews.

During the summer of 2022, we began creating version 2 of Working NYC based on our learnings from the previous two years, listening to job-seekers' desires for family-sustaining careers. We are now providing them with a redesigned site with more resources to help them navigate New York City’s workforce landscape. This process is ongoing as we seek to meet the needs of employers looking to tap into New York City’s greatest resource, its diverse talent.

The code for Working NYC is open source, leveraging the WordPress CMS and The Mayor’s Office for Economic Opportunity’s Design System for digital services. We also receive support from the NYC Office of Technology and Innovation to host the website on nyc.gov through the WP Engine platform. Through engagement with the Mayor’s Office for People with Disabilities, we also ensure that the website meets Web Content Accessibility Guidelines AA compliance.
