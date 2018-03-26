all: exploit

exploit: clean
	gcc generate.c verify.c main.c -o exploit -lcrypto

clean:
	rm -f exploit