#poll.py
import discord
import re

poll_phrases = [
    'make a poll', 'create a poll', 'start a poll'
    ]

def check_phrases(message_content_lower):
    return {'poll_phrases': any(phrase in message_content_lower for phrase in poll_phrases)}

async def create_poll(message):
    match = re.search(r'make a poll:?\s*(.*)', message.content, re.IGNORECASE | re.DOTALL)
    if match:
        poll_content = match.group(1).strip()

        try:
            poll_parts = poll_content.split('|')
            poll_question = poll_parts[0].strip()
            poll_options = [option.strip() for option in poll_parts[1:]]

            if len(poll_options) < 2:
                await message.channel.send("Please provide the poll question and options in the format: 'Matsuda, make a poll: Question | Option1 | Option2 | Option3 ...'")
                return

            if len(poll_options) > 10:
                await message.channel.send("Sorry, You can provide a maximum of 10 options for the poll!")
                return

            poll_message = f"**{poll_question}**\n"
            emoji_list = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
            for i, option in enumerate(poll_options):
                poll_message += f"{emoji_list[i]} {option}\n"

            poll_msg = await message.channel.send(poll_message)
            for i in range(len(poll_options)):
                await poll_msg.add_reaction(emoji_list[i])
        except Exception as e:
            print('Error creating poll:', e)
            await message.channel.send("Ah frick, I can't make a poll right now. Sorry...")
    else:
        await message.channel.send("Please provide the poll question and options in the format: 'Matsuda, make a poll: Question | Option1 | Option2 | Option3 ...'")
