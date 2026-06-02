# ADR-0005: Use generic web UI with rehabilitation as anchor scenario

* Status: accepted
* Workload: 0,25h
* Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
* Issue: [2](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/2)
* Date: 2026-05-31

## Context

After the initial proof of concept the idea is now to develop a gesture vocabulary, mapping typical interaction
patterns onto possible gestures for a chosen context. The course introduced presentation control as a reference scenario.

Two questions follow from this:

1. **Which application context?**
2. **At what abstraction level should the gesture vocabulary live?**

## Considered Options

For the application context:

- **Presentation control**
- **Generic web UI without an anchor scenario**
- **Rehabilitation / physiotherapy / sport at home**
- **Cooking / workshop / similar hands-occupied scenarios**

For the vocabulary level:

- **Domain-specific vocabulary**
- **Generic component-interaction vocabulary**
- **Hybrid: generic vocabulary with a concrete reference column**

## Decision

**Application context: Generic web UI with rehabilitation as anchor scenario**
**Vocabulary level: hybrid.** 
Entries are written at the level of generic UI component interactions, with an additional column showing the rehab-specific instantiation of each interaction.

## Pros and Cons of the Options

### Application context

#### Presentation control

**Pros**

- Familiar to the audience, low explanatory overhead
- Small fixed interaction set is easy to cover completely

**Cons**

- Problem is already solved by analog solutions e.g. presenter remotes. Gesture control offers no real advantage in the default presentation setting.
- Limited interaction variety

#### Rehabilitation / physiotherapy / sport at home

**Pros**

- Real and well-documented problem
- Hands and full body are genuinely unavailable for touch input during the exercise —> gesture control is not just a gimmick
- Allows for a richer interaction set
- Allows later extensions that go beyond "gesture as input": rep counting, form checking, etc. 

**Cons**

- Domain knowledge required for later extensions. Exercises must be selected from a credible source
- The author is not a physiotherapist; the project is at best a feasibility prototype, not a clinical tool

#### Cooking / workshop scenarios

**Pros**

- Real-world problem

**Cons**

- Already partially solved by voice-driven solutions
- Interaction set is smaller than rehab (mostly next/previous, some timers)
- Less natural fit with the pose modality. Most cooking happens in the near range, so the full-body tracking stays unused.

#### Generic web UI without an anchor

**Pros**

- Maximum reuse of the resulting vocabulary across future apps.

**Cons**

- Stays abstract without real application context

---

### Vocabulary level

#### Domain-specific

**Pros**

- Concrete and directly evaluable

**Cons**

- Ties components to one domain

#### Generic component-interaction

**Pros**

- Directly translates into library component vocabulary

**Cons**

- Reliability assessments risk being too vague without a concrete scenario to anchor them

#### Hybrid (chosen)

**Pros**

- Combines library-friendly abstraction with concrete grounding for reliability assessments

**Cons**

- Some extra effort: one additional column
- Forces thinking on two levels simultaneously when writing the table