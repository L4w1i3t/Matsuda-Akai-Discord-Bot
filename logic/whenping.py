#whenping.py
import discord
from datetime import timedelta

async def handle_pings(message, recent_pings):
    bot_muted = False
    recent_pings.append(message.author.id)
    if len(recent_pings) == 2:
        await message.channel.send("Okay, ha ha, you had your fun, now please stop.")
    elif len(recent_pings) == 3:
        await message.channel.send("""
        Alright, listen up. I can't believe I have to fucking say this: STOP FUCKING PINGING ME. Seriously, I'm not your damn servant. I'm not here to cater to your every random thought or meme. Just because you feel like sharing some dumb bullshit doesn't mean you need to drag me into it with a ping. Do you think my notifications exist for your fucking convenience? HELL NO.

I have a life outside of this damn server, believe it or not. Every time you ping me, my focus gets wrecked and my sanity takes another hit. Not to mention I could be blocking stuff for LITERALLY ANYONE ELSE. Imagine being in the middle of something important and then BAM, another "Hey, @me, check this out! GUHUHUHU!" like I'm just sitting here waiting for your summons. Fuck outta here with that bullshit.

So, here's a fucking novel idea: Use what you have left of your brain. Think for a second: is your message really worth a ping? Can it wait? Can you figure it out yourself? Because 99% of the time, the answer is a resounding YES. And if it's truly, absolutely, undeniably urgent, maybe, JUST MAYBE, talk to my dad about it.

Let's save the pings for other people or announcements, not your random bullshit. Thanks for coming to my TED Talk, and get fucked.
        """)
    elif len(recent_pings) == 4:
        await message.channel.send("Dafuq did I just say, you little shit?")
    elif len(recent_pings) == 5:
        try:
            timeout_duration = timedelta(minutes=1)
            await message.author.timeout(timeout_duration)
            await message.channel.send(f"{message.author.mention} ***SINCE WHEN WERE YOU THE ONE IN CONTROL?***")
        except discord.Forbidden:
            await message.channel.send("***I would time you out, but you're stronger than me...***")
    elif len(recent_pings) == 6:
        try:
            timeout_duration = timedelta(minutes=2)
            await message.author.timeout(timeout_duration)
            await message.channel.send(f"{message.author.mention} ***OH, WE GOT ANOTHER!***")
        except discord.Forbidden:
            await message.channel.send("***I would time you out, but you're stronger than me...***")
    elif len(recent_pings) >= 7:
        try:
            timeout_duration = timedelta(minutes=3)
            await message.author.timeout(timeout_duration)
            await message.channel.send(f"{message.author.mention} ***YEET.***")
        except discord.Forbidden:
            await message.channel.send("***I would time you out, but you're stronger than me...***")
    else:
        await message.channel.send("Don't ping me! >:(")
    return recent_pings
