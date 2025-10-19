# Route Genie 

## Inspiration
As avid climbers and engineers, we noticed that **setting routes on kilter boards is slow, inconsistent, and requires expert knowledge**. Climbing gyms often struggle to generate varied and challenging routes for each of our skill sets. We thought: *“What if we could harness the power of AI to automate this process, making climbing more accessible, fun, and perfect for our skill level?”*

This inspired us to **combine AI, robotics, and user interfaces** to create a system that can generate climbing routes from a simple prompt and deploy them to a kilter board in real-time.

## What We Learned
Working on this project taught us a lot about:
* **Prompt engineering:** Translating human-readable route requests into structured AI prompts.
* **AI integration:** Using the Gemini API and then our own model to generate route JSON data.
* **Embedded systems & Bluetooth:** Converting AI output into commands the kilter board can interpret.
* **User interface design:** Building a responsive UI to preview and send climbing routes.
* **Problem-solving:** Handling mismatched data formats, timing issues, and real-world constraints like hold placement.

We also got a deeper appreciation for **how AI can bridge the gap between physical and digital experiences**.

## How We Built It

The system has **four main components**:

1. **Prompt Parsing & Engineering**

   * Users input a natural-language description of the route (difficulty, style, start/finish).
   * We preprocess the prompt to optimize it for the Gemini API, ensuring consistent and high-quality outputs.

2. **AI Route Generation (Gemini API -> our own model)**

   * The engineered prompt is sent to the API.
   * The API returns a **JSON describing the holds**, including position, color, and type.
   * Example JSON snippet:

   ```json
   {
     "id": "1133",
     "color": "cyan"
   }
   ```

3. **Conversion to Bluetooth Commands**

   * The JSON is converted into **Bluetooth packets** compatible with the kilter board.
   * Each hold’s coordinates and color are encoded into a compact format for transmission.

4. **UI & Deployment**

   * The UI previews the route on-screen, showing hold positions and colors.
   * Users can click **“Send Bluetooth”** to deploy the route to the kilter board.
   * Real-time feedback ensures the AI route matches expectations before climbing.

Mathematically, hold positions are scaled from the AI output using:

$$
cx_{board} = cx_{json} \times w_{board} + x_{offset}, \quad
cy_{board} = cy_{json} \times h_{board} + y_{offset}
$$

where $w_{board}$ and $h_{board}$ are the physical board dimensions.

## Challenges

* **Data alignment:** Ensuring JSON holds coordinates matched the physical board layout.
* **Bluetooth reliability:** Handling intermittent connections and ensuring correct packet delivery.
* **Prompt quality:** Engineering prompts to consistently produce valid climbing routes were nontrivial.
* **User experience:** Designing a UI that was both intuitive and accurately reflected AI output.

Despite these challenges, we **iterated quickly**, tested often, and ended up with a fully functional system that can generate and deploy routes with a single click.

## Reflection

This project showed us the **power of AI in physical applications**. By connecting AI output to real-world hardware, we created a tool that could **revolutionize climbing gyms**. Beyond the technical skills, we also improved our **teamwork, problem-solving, and pitching abilities**.
