#setup.py
from setuptools import setup, find_packages

setup(
    name='MatsudaAkaiBot',
    version='0.1.0',
    description='A versatile Discord bot for entertainment and assistance.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    author='L4w1i3t',
    author_email='N/A',
    url='https://github.com/L4w1i3t/Matsuda-Akai-Discord-Bot',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'discord.py',
        'python-dotenv',
        'requests',
        'cryptography',
        'numpy',
    ],
    entry_points={
        'console_scripts': [
            'mab = package.main:main',
        ],
    },
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.8',
)
