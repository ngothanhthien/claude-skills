# Type-Specific Workflows

Select the appropriate flow based on task type:

| Type         | Flow File                                         |
| ------------ | ------------------------------------------------- |
| Bug fix      | [flow-bugfix.md](flow-bugfix.md)                  |
| New feature  | [flow-new-feature.md](flow-new-feature.md)        |
| Modification | [flow-modification.md](flow-modification.md)      |
| Extension    | [flow-extension.md](flow-extension.md)            |

## UI Work

If UI involved:
- Create **separate UI task(s)**, labeled `[UI]`
- Include lightweight **wireframe description**
- Use component names: Select, Accordion, Alert, Button, Modal, Form, Table, Card, etc.

## Checkpoints

At each approval point, ask explicitly:
- "Does this [ERD/current logic/target logic/use cases] look correct?"
- "Should I proceed to the next step?"

Never skip approval checkpoints.
