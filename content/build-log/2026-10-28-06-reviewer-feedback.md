---
title: 'Feedback round: three simulated hiring managers'
date: 2026-10-28
---

I had Claude Code read the live site as three hiring managers would, each with a different team in mind, and then fixed what they agreed on.

**What they flagged**

- A bug: the fig. 2 counter showed "0" between Prev and Next. The impact strip's count-up script was grabbing every element with a `data-count` attribute, and the counter had one too.
- The count-up itself: anyone who looked mid-animation saw wrong numbers.
- Identity was slow. The page opened on a slogan, so they had to read the header to learn my name, role and seniority.
- Steppers were inconsistent. Some wrapped around and some stopped at the ends with no sign that they had.
- The red "inject the corrupt message" button looked like a warning, not an invitation.
- If their stack uses Kafka or Debezium, nothing on the site connected my work to their vocabulary.
- Projects led with grad-school coursework, not the work I do now.

**What changed**

- The hero now reads "Sricharan Anand", then my role, years, ex-Amazon and San Jose, then Email, LinkedIn and Resume buttons. "The pipeline is the portfolio." moved down to label the diagram.
- The impact figures are static now, in a 2 × 2 grid at tablet widths, with a short stack line under them taken from my resume.
- Steppers stop at the ends, with the button disabled and focus moved to the other one. Fig. 2 still loops through the stages, and its buttons now say so.
- The replay button is neutral and says what it does, with one sentence above it.
- Working with me has a new "If your stack looks different" table. It maps my work onto general concepts, and it is labelled as concepts, not claimed experience.
- Projects opens with the reconciliation proof of concept. The ML coursework is now one line at the bottom.
- Build log moved to the footer. Fig. 2 shows a "scroll →" hint when a record is wider than its box, and printing the home page now shows every record version and replay step.

**What still needs my input**

- Testimonials: still waiting on a LinkedIn export.
- Whether "6+ years" should count only from Amazon, which is how it is counted now, or include grad-school work.
