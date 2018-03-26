#include <string.h>
#include <stdlib.h>
#include "generate.h"
#include <stdio.h>

struct god_s * generate (int * word,int size_w,char ** swap,int size_s){
	struct god_s * res=malloc(sizeof(struct god_s));
	struct element_s *f_element;
	int i;
	f_element=res->first=malloc(sizeof(struct element_s));
	f_element->next=NULL;
	res->ptable=cpy(swap,size_s);
	res->size_p=size_s;


	for(i=0;i<size_w-1;i++)
		init_element(f_element,*(word+i));

	res->size=size_w;
	f_element->choice=*(word+i);
	f_element->current=0;

	return res;
}

static struct string * cpy(char ** src,int size_s){
	int size;
	int i;
	char ** save_s;
	struct string * save_r,* res;
	char * posibility;

	save_r=res=malloc(size_s*sizeof(struct string));
	save_s=src;

	for(i=0;i<size_s;i++,save_s++,save_r++){
		posibility=*save_s;
		for(size=0;*posibility!='\0';posibility++,size++);
		save_r->word=malloc(sizeof(char)*size);
		save_r->size=size;

		strcpy(save_r->word,(const char *)*save_s);
	}

	return res;
}

static void init_element(struct element_s * element,int possibility){
	struct element_s *new=malloc(sizeof(struct element_s));
	new->choice=possibility;
	new->current=0;
	new->next=element->next;

	element->next=new;
}

void init_next(struct god_s* list,int retenue){
	int add;
	struct element_s *element;
	struct string *posibilitys;

	element=list->first;
	for(;element !=NULL && retenue!=0;element=element->next){
		posibilitys=list->ptable+element->choice;
		add=(element->current+retenue)%(posibilitys->size);
		retenue=(element->current+retenue)/posibilitys->size;
		element->current=add;
	}

}

void next(struct god_s* list,char *res){
	int retenue=1;
	int add;
	struct element_s *element;
	struct string *posibilitys;

	element=list->first;
	res+=list->size-1;

	for(;element !=NULL && retenue!=0;element=element->next,res--){
		posibilitys=list->ptable+element->choice;
		*res=*(posibilitys->word+element->current);

		add=(element->current+retenue)%posibilitys->size;
		retenue=(element->current+retenue)/posibilitys->size;
		element->current=add;
	}

	for(;element!=NULL;element=element->next,res--){
		posibilitys=list->ptable+element->choice;
		*res=*(posibilitys->word+element->current);
	}
}
