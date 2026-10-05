Create a dynamic website that shows one dot per day in my life. Colors in the dots should represent different events. Not lived yet days should be gray. For the meaning of the dots use a TOML or JSON or YAML data file.

Architecture:

- Astro Website
- Typescript 6 (do not upgrade to 7 because Astro is not compatible with it yet)
- Theme via Tailwind CSS and ShadCN
- Use a dark theme and base greys on "misty" color of tailwind, no theme switcher needed
- onboard via `/dnbhq-configs` to dnbhq configurations that are required for the project

Execution:

- show a content column of 100% and max-width of 800px
- show dots in that column (left to right, top to bottom) with a small margin between them
- on desktop they react to hover, on mobile they react to tap
- on hover/tap, show a tooltip with the event name and date
- if we have no event for the day, show the date in the tooltip 
- color all birthdays in red
- create a way to color recurring events that can be calculated (like 1st of the year, birthday, etc.) 
- assume an average age for me of 80.5 years for now (that's the life expectancy for someone born in 1975 in east germany and being male. Which I am)
- take into account leap years

Data:

- date: The date of the event in YYYY-MM-DD format
- event: The name of the event
- color: The color to represent the event (rgb or hex or tailwind color class)
- recurring: A boolean indicating if the event is recurring (true/false)
- period (or frequency): If recurring is true, specify the period (e.g., "yearly", "monthly", "weekly")

Individual current data:

- 1975-07-05 birthday orange-700 true yearly
- 80.5 years of life expectancy
