This document outlines the specific goals and tasks for your first two-week development sprint.

Sprint Goal: A single, clear sentence describing the main objective of Sprint 1 (e.g., "Establish the backend user authentication service and build the frontend login/registration pages.").

Sprint 1 Backlog: A list of the specific user stories and tasks selected from the Product Backlog that your team commits to completing in the first sprint.

Task Breakdown: Each story should be broken down into smaller technical tasks (e.g., "Design database schema for users," "Create REST API endpoint for login," "Build the login UI component"). Assign each task to a team member.

# Sprint Backlog:  Full Stack Force / PetQuest 

**Sprint Dates:** September 30th, 2025 to October 22nd, 2025

**Sprint Goal:** Get our app running with the core features being able to sign-up, login, view the calendar, and view the to-do list.

---

## User Stories:
 
### Story 1: Individual Account Creation
* **As a:** Person with no children
* **I want to:** Create an account
* **So that:** I can login to access my to do list and calendar
* **Priority:** High
* **Effort:** High
* **Assigned to:** Calvin Chau
* **Acceptance Criteria:**
    * [ ] Criterion 1: On the sign in account page, I can select the type of account I create and click on the next button to bring me to the next page after entering my email. Any non-email would not work
    * [ ] Criterion 2: I am sent a verification code through email and can enter it to the verification page to create my account.
    * [ ]Criterion 3: The User information inputted during account creation is the same shown in my profile. If the email and/or password is wrong, I should get an error message.
 
  
### Story 2: Family Account Creation
* **As a:** Parent
* **I want to: Create an account
* **So that:** I can login and send tasks to my children
* **Priority:** High
* **Effort:** High
* **Assigned to:** Calvin Chau
* **Acceptance Criteria:**
     * [ ]Criterion 1: On the sign in page, I can select the family button to create an account and choose to create a parent account for myself.
     * [ ]Criterion 2: I can enter my user information to create the account and receive a verification code through my email. I can enter it to create an account.
     * [ ]Criterion 3: The user information I inputted should be the same as in the account page and I should be able to login with it. If the email and/or password is wrong, I should get an error message.
Account Login


### Story 3: Account Login
* **As a:** any of the users (personal, child, parent)
* **I want to:** login to my account
* **So that:** I have access my to do list and calendar
* **Priority:** High
* **Effort:** Medium
* **Assigned to:** Christ Nguyen
* **Acceptance Criteria:**
    * [ ] Criterion 1: On the sign in account page, if I were to put in a wrong email, it will give me some sort of error 
     * [ ]Criterion 2: If I forgot my password, I should be able to click “forgot password” and reset it through email and be able to change it and login in successfully
     * [ ]Criterion 3: if i input the wrong password, it will give me an error so that I can try again or click forget password


### Story 4: Navigation bar Functionality
* **As a:** Child, parent, and single user
* **I want to:**  I want to easily access the navigation bar
* **So that:**  I can access other parts of the app (tasks, calendar, settings, etc)
* **Priority:** Low
* **Effort:** Low
* **Assigned to:** Tasos
* **Acceptance Criteria:**
       * [ ] Criterion 1: The bottom task bar buttons switch to the relevant page quickly
  
### Story 5: Child view of calendar
* **As a:** Child
* **I want to:** View my current months calendar
* **So that:**  I can easily see my months agenda and plan around tasks
* **Priority:** Medium
* **Effort:** Medium- Hard
* **Assigned to:** Khanh
* **Acceptance Criteria:**
     Criterion 1: Calendar page allows users to view the to do list for a day when that day is clicked on
     Criterion 2: A task is marked as completed once marked as completed
     Criterion 3: Points are added to account once a task is completed

### Story 6: Child Views Tasks on to-do list
* **As a:** Child
* **I want to:** View the tasks on my to do list and mark them complete
* **So that:** I know what tasks I need to do and what I’ve finished
* **Priority:** Medium
* **Effort:** Medium
* **Assigned to:** Natali Soto
* **Acceptance Criteria:**
      Criterion 1: I should be able to see all the tasks I need to do and what I’ve finished
      Criterion 2: If I’m sent a new task, it should show up on the to do list 

### Story 7: View Tasks for Different Days
* **As a:**  Child
* **I want to:**  Switch between days and view tasks for different days
* **So that:**  I know my current and future tasks
* **Priority:** Medium
* **Effort:** Medium
* **Assigned to:**  Natali Soto
* **Acceptance Criteria:**
      Criterion 1: I can switch between days and view my tasks for that day
      Criterion 2: I should see a change in dates and tasks
      Criterion 3: I should be able to see all of my completed/ incomplete tasks for each day

### Story 8: Task Details
* **As a:** Individual
* **I want to:** Be able to write details under each task and view them
* **So that:**  I can be reminded of the specifics of a task I set quickly
* **Priority:** High
* **Effort:** Medium
* **Assigned to:** Khanh
* **Acceptance Criteria:**
      Criterion 1: On the to do list page, clicking a button next to the task activates a drop down and allows users to view details about that task
      Criterion 2: Users can press a different button to add details about a task
      Criterion 3: Users can click on a task in the calendar view and have the task and the details pop up


### Story 9: Account Storage/Database
* **As a:** User
* **I want to:** have my account persist after logging out
* **So that:** I can know my settings, calendar and to do list are saved
* **Priority:** Medium
* **Effort:** Medium
* **Assigned to:** Christ Nguyen
* **Acceptance Criteria:**
      Criterion 1: The account details are stored in a database
      Criterion 2: The account details in the database are updated when a user updates their profile
      Criterion 3: The account details are deleted from the database when a user deletes their account


### Story 10: Pet Pages 
* **As a:** User
* **I want to:** View my pets, shop, and accessories
* **So that:** I can customize my pets and engage with the fun side of the app
* **Priority:** Medium
* **Effort:** High
* **Assigned to:** Nalysse
* **Acceptance Criteria:**
     Criterion 1: Users can view their pet collection.
     Criterion 2: Users can visit the shop to browse accessories.
     Criterion 3: Users can equip/unequip accessories to their pets.





### If we finish these quicker than expected, please work on another user story and let the team know!
