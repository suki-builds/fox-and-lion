import Link from 'next/link';

export const metadata = {
  title: 'Submissions Guidelines — Fox and Lion',
};

// Static page (not pulled from Prismic) since this changes rarely — edit
// this file directly when the guidelines are updated. Source: Contributors'
// Guidelines v04.docx.
export default function SubmissionGuidelinesPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Submissions Guidelines</h1>

      <div className="article-body">
        <p>
          Contributors are kindly requested to read these guidelines in full before
          submitting an article. Submissions that are not in line with the guidelines will
          not be considered for publication. Thank you.
        </p>
        <p>
          Fox and Lion exists to bring clarity and candour to the conversation around
          defence capability and technology. We are fortunate to be read by platoon
          leaders and procurement officials alike, by engineers, founders, investors, and
          civil servants, and, most importantly, by serving and former warfighters. We ask
          a great deal of those who write for us, and in return we offer a readership with
          a genuine interest in what is written. We would ask that this guide be read in
          full before a pitch is made; it will save contributors and editors alike a great
          deal of time.
        </p>

        <h2>Whom We Publish</h2>
        <p>
          Our contributors are those who have stood close enough to a subject to have
          earned an opinion on it. In practice, this generally means one or more of the
          following: service in uniform, meaningful time within government or industry, or
          a clear record of peer-reviewed or otherwise rigorously tested research.
          Engineers, programme managers, and founders working at the sharp end of the
          defence technology sector are all equally welcome. Other valuable grounding
          includes considerable time spent on the ground, working on or studying an issue
          of interest to our readers, particularly within a conflict zone; this may
          include work with a non-governmental organisation or in journalism, though we
          would note that Fox and Lion is dedicated to analysis and commentary rather than
          journalistic reporting. We would ask that contributors explain clearly why their
          experience makes them the right person to write the piece proposed.
        </p>
        <p>
          We are conscious that our field has not always drawn upon the full range of
          talent available to it. Pitches from writers of backgrounds under-represented in
          defence and technology, as well as from those earlier in their careers with
          something genuinely new to say, are particularly welcome.
        </p>
        <p>
          We are not in a position to accept pitches or submissions from those whose sole
          claim to the subject is academic interest, absent other relevant, non-academic
          experience.
        </p>
        <p>
          We do not accept pitches or submissions routed through communications agencies,
          PR consultants, or press offices, and would ask to hear from the author
          directly, whatever their seniority.
        </p>

        <h2>The Submission Process</h2>
        <p>
          All pitches should be submitted through our{' '}
          <Link href="/submission-portal">submissions portal</Link>; we would ask
          that pitches not be sent by email or any other form of personal correspondence.
          A pitch should be brief (under 200 words) comprising the main argument to be
          made, together with a short account of why the author&rsquo;s experience
          qualifies them to make it.
        </p>
        <p>
          Every pitch received is read, though as a small team your patience is greatly
          appreciated. We aim to respond within five working days. Should a fortnight pass
          without a response from us, a polite follow-up through the portal is entirely
          welcome. Silence on our part reflects the volume of work before us, never a
          judgement on the pitch itself.
        </p>
        <p>
          Should a pitch be accepted and a full submission requested, a draft between 800 
          and 1,500 words should be submitted. Review and editing
          may take anywhere from a day to over a week. Being asked for a full submission
          is not equivalent to acceptance for publication; we review thoroughly, at times
          with the assistance of outside subject-matter readers, and do occasionally
          decline pieces at that later stage. Where this occurs, we will endeavour to
          suggest another outlet that may better suit the work.
        </p>
        <p>
          We would further ask that a piece not be submitted elsewhere while under
          consideration with us, and that we be informed promptly should circumstances
          change. Editorial time, once given, cannot be recovered, and we take this
          courtesy seriously in both directions.
        </p>

        <h2>Additional Notes</h2>
        <p>
          <strong>On our readership.</strong> Fox and Lion is read across the world, and
          contributors are asked to bear in mind that their work may reach those
          unfamiliar with the institutions or context of a particular nation or region.
        </p>
        <p>
          <strong>On assumed knowledge.</strong> Our readership spans a broad range of
          professions and experience, and few readers will share a contributor&rsquo;s own
          background. Contributors are asked to take the time to explain concepts and
          terms with care, so that the piece may be followed by as wide an audience as
          possible.
        </p>
        <p>
          <strong>On specialist language.</strong> Acronyms, initialisms, and terms of art
          are a feature of military and technical language, yet they vary considerably by
          service, nation, and field. With the exception of the most widely understood
          (UN, NATO, FY20XX for example) such terms should be spelled out and explained at
          first use.
        </p>
        <p>
          <strong>On form.</strong> We would ask that submissions take the form of a
          considered article rather than a memorandum; bullet points and numbered lists
          are not part of Fox and Lion&rsquo;s style. Prospective contributors are
          encouraged to read previously published analyses to gain a fuller sense of the
          form we publish.
        </p>
        <p>
          <strong>On voice.</strong> Fox and Lion places considerable weight on personal
          experience, and contributors who feel it appropriate are warmly encouraged to
          write in the first person. Opening a piece with one&rsquo;s own experience is
          often the most effective means of establishing credibility with the reader.
        </p>
        <p>
          <strong>On sourcing.</strong> Contributors are kindly requested to cite factual
          statements and the words of others by way of an embedded hyperlink, wherever
          this is possible.
        </p>
        <p>
          <strong>On the use of artificial intelligence.</strong> Contributions should
          reflect the contributor&rsquo;s own judgement, research, and voice. While the
          growing capability and ubiquity of artificial intelligence is recognised, Fox
          and Lion&rsquo;s purpose rests upon personal experience and considered opinion,
          and a published piece stands as a direct reflection of its author. Contributors
          are strongly encouraged to write without recourse to artificial intelligence,
          and submissions found to have been substantially generated or edited by such
          tools will not be accepted.
        </p>

        <h2>Your Biography</h2>
        <p>
          A biography of two to three sentences should be included at the close of the
          piece, setting out the author&rsquo;s background, affiliations, and previous
          work. This is the appropriate place for credentials to speak for themselves;
          contributors are welcome to include a hyperlink to a personal or company
          website, a Substack, or the Amazon page for a published book.
        </p>
      </div>
    </div>
  );
}
