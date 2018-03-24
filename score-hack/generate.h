struct string {
	char * word;
	int size;
};

struct element_s{
	int current;
	int choice;
	struct element_s * next;
};

struct god_s {
	struct element_s * first;
	int size;
	struct string * ptable;
	int size_p;
};

/**
 * Permit to generate god structure
 */
struct god_s* generate (int * word,int size_w,char ** swap,int size);

/**
 * Permit to add value on possibity
 */
void next(struct god_s * god,char * word);

/**
 * Super doc de la mort qui tue 
 */
void init_next(struct god_s* list,int retenue);

/**
 * Pizza fromage
 */
static void init_element(struct element_s * element,int possibility);

/**
 * Permit to creat copy of src in dest
 */
static struct string *cpy(char ** src,int size);

