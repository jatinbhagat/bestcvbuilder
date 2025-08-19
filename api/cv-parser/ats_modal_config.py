"""
ATS Modal Configuration
Generic explanations for each category explaining why they matter for ATS scoring
"""

ATS_MODAL_CONFIG = {
    'Action Verbs': {
        'title': 'Why Action Verbs Matter for ATS',
        'generic_explanation': """Many people use weak action verbs like "Assisted" or "Worked on" in their resumes. This is a mistake because:

**Ineffective**: They only show you were involved in some part of a project, not your specific contribution. Hiring managers can't tell if you did admin work, engineering, development, project management, or sales. They'll just assume the worst, and think you didn't have a key role at all.

**Generic**: These words could fit in any job ad, not a personal resume.

**Lack of impact**: They don't show your skills or what you achieved."""
    },
    
    'Repetition': {
        'title': 'Why Verb Repetition Hurts Your ATS Score',
        'generic_explanation': """Using the same action verbs repeatedly makes your resume boring and unprofessional. This damages your ATS score because:

**Monotonous**: Repeating "managed", "developed", or "created" multiple times shows limited vocabulary and poor writing skills.

**Missed opportunities**: Each bullet point is a chance to showcase different skills - repetitive verbs waste these opportunities.

**ATS penalties**: Modern ATS systems detect repetitive language and score it lower for poor content quality."""
    },
    
    'Personal Pronouns': {
        'title': 'Why Personal Pronouns Damage ATS Scoring',
        'generic_explanation': """Using words like "I", "me", "my", or "we" makes your resume sound unprofessional and hurts ATS scoring because:

**Unprofessional format**: Resumes should be written in third person without personal pronouns - it's the standard professional format.

**Wastes space**: Every "I" or "my" takes up valuable character space that could showcase achievements instead.

**ATS detection**: Modern ATS systems flag personal pronouns as poor resume formatting and reduce your score."""
    },
    
    'Quantifiable Achievements': {
        'title': 'Why Numbers Matter for ATS Success',
        'generic_explanation': """Resumes without specific numbers and metrics fail ATS screening because:

**No proof**: Statements like "improved efficiency" mean nothing without numbers - 5% improvement vs 50% improvement are completely different.

**Generic claims**: Without metrics, your achievements sound like generic templates that anyone could write.

**ATS ranking**: ATS systems specifically look for quantified results - resumes with numbers consistently rank higher."""
    },
    
    'Summary': {
        'title': 'Why Professional Summary Affects ATS Ranking',
        'generic_explanation': """A weak professional summary kills your ATS score before recruiters even see your experience because:

**First impression**: It's the first thing ATS systems analyze - generic buzzwords like "results-driven" or "passionate" immediately lower your score.

**Keyword density**: ATS systems expect specific skills, metrics, and achievements in summaries, not vague personality descriptions.

**Professional standards**: Personal pronouns ("I am", "my experience") make you sound unprofessional compared to candidates with crisp, metric-focused summaries."""
    },
    
    'Dates': {
        'title': 'Why Date Consistency Impacts ATS Parsing',
        'generic_explanation': """Inconsistent date formats confuse ATS systems and hurt your ranking because:

**Parsing errors**: ATS systems expect consistent formats like "Jan 2020 - Dec 2022" - mixing formats causes parsing failures.

**Timeline gaps**: Inconsistent dating makes it impossible for ATS to calculate experience length accurately.

**Professional standards**: Mixed date formats signal poor attention to detail and inconsistent documentation skills."""
    },
    
    'Grammar': {
        'title': 'Why Grammar Errors Destroy ATS Credibility',
        'generic_explanation': """Grammar mistakes immediately disqualify candidates because:

**Professional competence**: Basic grammar errors signal poor communication skills and lack of attention to detail.

**ATS detection**: Modern ATS systems use AI to detect grammar issues and automatically lower scores for poor writing quality.

**Competitive disadvantage**: With AI tools available, grammar errors are completely avoidable - they show carelessness."""
    },
    
    'Spelling': {
        'title': 'Why Spelling Mistakes Kill ATS Rankings',
        'generic_explanation': """Spelling errors are resume killers that destroy ATS scores because:

**Immediate disqualification**: Most recruiters reject resumes with spelling errors within seconds of reviewing.

**ATS penalties**: Modern ATS systems detect misspelled words and heavily penalize content quality scores.

**Professional standards**: In an age of spellcheck and AI tools, spelling errors show complete lack of care and professionalism."""
    },
    
    'Contact Details': {
        'title': 'Why Complete Contact Info Affects ATS Processing',
        'generic_explanation': """Missing or incomplete contact information causes ATS failures because:

**Parsing requirements**: ATS systems expect standard contact formats - missing elements cause parsing errors and lower scores.

**Recruiter access**: Without complete contact info (phone, email, LinkedIn), recruiters can't reach you even if interested.

**Professional completeness**: Incomplete contact sections signal poor resume preparation and attention to detail."""
    },
    
    'Skills Section': {
        'title': 'Why Skills Section Determines ATS Matching',
        'generic_explanation': """A weak skills section causes ATS rejection because:

**Keyword matching**: ATS systems primarily match job requirements against your skills section - missing key skills = automatic rejection.

**Relevance ranking**: Generic skills like "communication" don't help - ATS looks for specific technical skills and tools.

**Competitive advantage**: Candidates with comprehensive, relevant skills sections consistently outrank those with generic or missing skills."""
    },
    
    'Analytical': {
        'title': 'Why Analytical Skills Boost ATS Rankings',
        'generic_explanation': """Missing analytical examples hurt modern ATS scoring because:

**Market demand**: 90% of modern jobs require data-driven decision making - ATS systems specifically look for analytical capabilities.

**Competitive differentiation**: Candidates who demonstrate analytical thinking with specific examples and tools rank significantly higher.

**Future-proofing**: ATS algorithms prioritize candidates who show adaptation to data-driven work environments."""
    },
    
    'Leadership': {
        'title': 'Why Leadership Examples Impact ATS Success',
        'generic_explanation': """Weak leadership demonstration hurts ATS ranking because:

**Career progression**: ATS systems look for leadership indicators as signs of career growth and promotion potential.

**Quantified impact**: Leadership without numbers (team size, budget, results) appears generic and unverifiable.

**Competitive edge**: Specific leadership achievements with metrics consistently outperform generic leadership claims in ATS ranking."""
    },
    
    'Certifications': {
        'title': 'Why Certifications Boost ATS Credibility',
        'generic_explanation': """Missing relevant certifications hurts ATS ranking because:

**Skill verification**: Certifications provide objective proof of skills that ATS systems can verify and score highly.

**Industry standards**: Many roles expect specific certifications - missing them causes automatic ATS filtering.

**Competitive advantage**: Certified candidates consistently rank higher than those without professional credentials."""
    },
    
    'Growth Signals': {
        'title': 'Why Career Growth Affects ATS Evaluation',
        'generic_explanation': """Missing growth indicators hurt ATS scoring because:

**Promotion tracking**: ATS systems look for career progression patterns - flat careers signal stagnation.

**Ambition indicators**: Evidence of skill development and role advancement shows drive and capability.

**Future potential**: Candidates showing consistent growth patterns rank higher for long-term hiring success."""
    },
    
    'Drive': {
        'title': 'Why Initiative Examples Improve ATS Rankings',
        'generic_explanation': """Lack of initiative examples hurts modern ATS evaluation because:

**Self-starter identification**: ATS systems look for keywords indicating proactive behavior and self-motivation.

**Project ownership**: Examples of leading initiatives or solving problems independently rank higher than task-following descriptions.

**Leadership potential**: Drive indicators help ATS systems identify candidates with management and leadership potential."""
    },
    
    'Active Voice': {
        'title': 'Why Active Voice Improves ATS Processing',
        'generic_explanation': """Passive voice hurts ATS scores because:

**Clarity issues**: Passive voice makes it unclear who did what - ATS systems prefer clear, direct statements.

**Impact reduction**: "Was responsible for" sounds weaker than "Led" or "Managed" - active voice shows ownership.

**Professional writing**: Active voice is the standard for professional resumes and scores higher in ATS content analysis."""
    },
    
    'Teamwork': {
        'title': 'Why Collaboration Skills Matter for ATS',
        'generic_explanation': """Missing teamwork examples hurt ATS ranking because:

**Modern workplace**: 95% of jobs require collaboration - ATS systems specifically look for teamwork indicators.

**Cross-functional ability**: Examples of working across departments show adaptability and communication skills.

**Cultural fit**: Teamwork examples help ATS systems identify candidates who fit collaborative work environments."""
    },
    
    'Education Section': {
        'title': 'Why Education Section Affects ATS Processing',
        'generic_explanation': """A poorly formatted or incomplete education section hurts ATS ranking because:

**Required field**: Most ATS systems expect a dedicated education section - missing it causes parsing errors.

**Qualification verification**: Recruiters need to verify your educational background matches job requirements.

**Professional completeness**: Incomplete education details signal poor resume preparation and attention to detail."""
    },
    
    'Page Density': {
        'title': 'Why Page Density Impacts ATS Readability',
        'generic_explanation': """Poor page density (too crowded or too sparse) hurts ATS processing because:

**Parsing difficulty**: ATS systems struggle with overcrowded pages where text runs together.

**Visual scanning**: Recruiters spend only 6 seconds scanning - poor density makes key information invisible.

**Professional presentation**: Optimal white space and text density signal attention to design and readability."""
    },
    
    'Use of Bullets': {
        'title': 'Why Bullet Points Are Critical for ATS',
        'generic_explanation': """Not using bullet points properly damages ATS scores because:

**Structured parsing**: ATS systems expect bullet-formatted achievements - paragraphs are harder to parse and rank lower.

**Readability**: Recruiters scan bullet points 3x faster than paragraph text - poor formatting loses their attention.

**Professional standard**: Bullet points are the industry standard for resume formatting - not using them appears unprofessional."""
    },
    
    'Verb Tenses': {
        'title': 'Why Consistent Verb Tenses Matter for ATS',
        'generic_explanation': """Inconsistent verb tenses hurt ATS scoring because:

**Grammar standards**: ATS systems detect tense inconsistencies and penalize poor grammar quality.

**Timeline confusion**: Mixed tenses make it unclear whether roles are current or past positions.

**Professional writing**: Consistent tense usage (past for previous roles, present for current) is basic professional writing."""
    },
    
    'Verbosity': {
        'title': 'Why Concise Language Improves ATS Rankings',
        'generic_explanation': """Verbose, wordy language hurts ATS scores because:

**Keyword dilution**: Too many unnecessary words reduce the density of important keywords ATS systems scan for.

**Attention span**: Recruiters lose interest in wordy descriptions - concise, impactful language performs better.

**Parsing efficiency**: ATS systems prefer clear, direct language over flowery, verbose descriptions."""
    },
    
    'Unnecessary Sections': {
        'title': 'Why Outdated Sections Hurt ATS Performance',
        'generic_explanation': """Including unnecessary sections damages ATS ranking because:

**Space waste**: Outdated sections like "References" or "Objective" waste valuable resume real estate.

**Amateur appearance**: Including irrelevant information signals lack of modern resume knowledge.

**ATS penalties**: Some ATS systems flag outdated sections as indicators of low-quality resume preparation."""
    },
    
    'CV Readability Score': {
        'title': 'Why Overall Readability Affects ATS Success',
        'generic_explanation': """Poor overall readability kills ATS performance because:

**Comprehension difficulty**: If ATS systems can't easily parse and understand your content, you get ranked lower.

**Recruiter experience**: Hard-to-read resumes get rejected within seconds regardless of qualifications.

**Professional presentation**: Good readability signals strong communication skills and attention to detail."""
    }
}