# To do list

- [ ] Improve context bar for inventory which has better predictions like inclduing new ingredients or tools based on whats in the workspace.
- [ ] Better layout - the side panel is cluttered and tabs are missable.
- [ ] Change the image fetch logic to use specific get methods instead of string searches from names. We will replace this logic completely.
- [ ] Remove underscores from names.

# Technical Debt

- [ ] Refactor ingredient image path generation to handle spaces in ingredient names
  - Current workaround: Using underscores in ingredient names
  - Future solution options:
    - Add an `imagePath` property to decouple display name from file paths
    - Add a path sanitization function when generating image paths
    - Use a more robust asset management system