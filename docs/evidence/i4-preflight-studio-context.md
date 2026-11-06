# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phaseC.spec.ts >> studio stems start together; controls persist without revealing a solution
- Location: tests\e2e\phaseC.spec.ts:32:1

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active]:
  - generic:
    - generic:
      - link "Skip to the current room" [ref=f2e1] [cursor=pointer]:
        - /url: "#world-heading"
      - main "Alice’s studio" [ref=f2e2]:
        - heading "Something in the static." [level=1] [ref=f2e3]
        - generic [ref=f2e4]: STORY JOURNEY
        - generic [aria-hidden]:
          - generic: TRIAL II · VERIFICATION
          - generic: Alice’s studio
        - button [ref=f2e5] [cursor=pointer]:
          - generic [ref=f2e6]: Speak with Alice
        - navigation "Traveller’s kit" [ref=f2e7]:
          - button "Road map" [ref=f2e8] [cursor=pointer]
          - button "Notebook" [ref=f2e13] [cursor=pointer]
          - button "Room objects" [ref=f2e18] [cursor=pointer]
          - button "Journeys" [ref=f2e22] [cursor=pointer]
          - button "Settings" [ref=f2e27] [cursor=pointer]
          - button "Mute sound" [pressed] [ref=f2e34] [cursor=pointer]:
            - generic [ref=f2e38]: Sound
        - generic [ref=f2e39]: ✧ Journey saved in this browser
        - dialog "Alice’s recording desk" [ref=f2e40]:
          - generic [ref=f2e41]:
            - generic [ref=f2e42]:
              - generic [ref=f2e43]: TRACK FOUR · LIVE ROOM
              - generic [ref=f2e44]: Alice’s recording desk
            - button "Step back from the desk" [ref=f2e45] [cursor=pointer]: ×
          - generic [ref=f2e46]:
            - generic [ref=f2e47]:
              - heading "Find the recording number." [level=2] [ref=f2e48]
              - paragraph [ref=f2e49]: A two-digit number from 00–99. Each printed lyric strip gives a remainder. Open the three channels to build the recording.
            - generic [ref=f2e50]:
              - generic [ref=f2e51]:
                - generic [ref=f2e52]:
                  - text: ALICE · TRACK FOUR
                  - generic [ref=f2e53]: STEREO
                - group "Recording channels" [ref=f2e54]:
                  - button "CHANNEL 1 Divide by 3 remainder 2 OPEN" [pressed] [ref=f2e55] [cursor=pointer]:
                    - generic [ref=f2e56]: CHANNEL 1
                    - generic [ref=f2e64]: Divide by 3remainder 2
                    - emphasis [ref=f2e66]: OPEN
                  - button "CHANNEL 2 Divide by 5 remainder 3 OPEN" [pressed] [ref=f2e67] [cursor=pointer]:
                    - generic [ref=f2e68]: CHANNEL 2
                    - generic [ref=f2e76]: Divide by 5remainder 3
                    - emphasis [ref=f2e78]: OPEN
                  - button "CHANNEL 3 Divide by 7 remainder 2 OPEN" [pressed] [ref=f2e79] [cursor=pointer]:
                    - generic [ref=f2e80]: CHANNEL 3
                    - generic [ref=f2e88]: Divide by 7remainder 2
                    - emphasis [ref=f2e90]: OPEN
              - generic [ref=f2e91]:
                - generic [ref=f2e104]: Two-digit recording number
                - textbox "Two-digit recording number" [disabled] [ref=f2e105]: "23"
                - button "Dial the number" [disabled] [ref=f2e106]
            - generic [ref=f2e107]:
              - button "Play the record forwards" [ref=f2e108] [cursor=pointer]
              - button "Open the speaker doors" [ref=f2e120] [cursor=pointer]
            - paragraph [ref=f2e125]: "Record: backwards · speaker doors: closed."
          - generic [ref=f2e126]:
            - generic [ref=f2e127]:
              - generic [ref=f2e133]: Seal earned. Your work is safe.
              - button "Continue to Agatha’s cabin" [ref=f2e134] [cursor=pointer]: Continue to Agatha’s cabin ↗
            - status [ref=f2e135]:
              - generic: “That one sounded like coming home.” — Alice
              - text: The recording resolves. Verification seal earned.
```