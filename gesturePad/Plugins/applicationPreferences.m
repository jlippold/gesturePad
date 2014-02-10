//
//  applicationPreferences.m
//  
//
//  Created by Tue Topholm on 31/01/11.
//  Copyright 2011 Sugee. All rights reserved.
//
// THIS HAVEN'T BEEN TESTED WITH CHILD PANELS YET.

//it should now return all keys

#import "applicationPreferences.h"


@implementation applicationPreferences


- (void)getSetting:(CDVInvokedUrlCommand*)command
{

    //Set all default values: http://ijure.org/wp/archives/179
    NSUserDefaults * defs = [NSUserDefaults standardUserDefaults];
    [defs synchronize];
    
    NSString *settingsBundle = [[NSBundle mainBundle] pathForResource:@"Settings" ofType:@"bundle"];
    
    if(!settingsBundle)
    {
        //NSLog(@"Could not find Settings.bundle");
        return;
    }
    
    NSDictionary *settings = [NSDictionary dictionaryWithContentsOfFile:[settingsBundle stringByAppendingPathComponent:@"Root.plist"]];
    NSArray *preferences = [settings objectForKey:@"PreferenceSpecifiers"];
    NSMutableDictionary *defaultsToRegister = [[NSMutableDictionary alloc] initWithCapacity:[preferences count]];
    
    for (NSDictionary *prefSpecification in preferences)
    {
        NSString *key = [prefSpecification objectForKey:@"Key"];
        if (key)
        {
            // check if value readable in userDefaults
            id currentObject = [defs objectForKey:key];
            if (currentObject == nil)
            {
                // not readable: set value from Settings.bundle
                id objectToSet = [prefSpecification objectForKey:@"DefaultValue"];
                [defaultsToRegister setObject:objectToSet forKey:key];
                //NSLog(@"Setting object %@ for key %@", objectToSet, key);
            }
            else
            {
                // already readable: don't touch
                //NSLog(@"Key %@ is readable (value: %@), nothing written to defaults.", key, currentObject);
            }
        }
    }
    
    [defs registerDefaults:defaultsToRegister];
    [defs synchronize];
    
    //loop and send them back to JS
	NSString* jsString = @"{";
    CDVPluginResult* result = nil;
    
	NSString *pathStr = [[NSBundle mainBundle] bundlePath];
	NSString *settingsBundlePath = [pathStr stringByAppendingPathComponent:@"Settings.bundle"];
	NSString *finalPath = [settingsBundlePath stringByAppendingPathComponent:@"Root.plist"];
	NSDictionary *settingsDict = [NSDictionary dictionaryWithContentsOfFile:finalPath];
    NSArray *allSettings =  [settingsDict objectForKey:@"PreferenceSpecifiers"];

    NSDictionary *prefItem;
    NSMutableArray *tmp = [NSMutableArray array];
    
    for (prefItem in allSettings)
    {
        NSString *keyValPair = @"";
        keyValPair = [keyValPair stringByAppendingString: @"\""];
        
        
        if ([prefItem objectForKey:@"Key"]) {
            
            keyValPair = [keyValPair stringByAppendingString: (NSString*)[prefItem objectForKey:@"Key"]];
            keyValPair = [keyValPair stringByAppendingString: @"\" : \""];
            NSString *itemKey = (NSString*)[prefItem objectForKey:@"Key"];
            
            if (  [[NSUserDefaults standardUserDefaults] stringForKey:itemKey] ) {
               keyValPair = [keyValPair stringByAppendingString:(NSString*)[[NSUserDefaults standardUserDefaults] stringForKey:itemKey] ];
            } else {
                if ([prefItem objectForKey:@"DefaultValue"]) {
                    keyValPair = [keyValPair stringByAppendingString: (NSString*)[prefItem objectForKey:@"DefaultValue"]];
                }
            }
            
            keyValPair = [keyValPair stringByAppendingString: @"\""];
            [tmp addObject:[NSString stringWithString: keyValPair]];
            
        }
        
        
    }
    
    jsString = [jsString stringByAppendingString:[tmp componentsJoinedByString:@","]];
    jsString = [jsString stringByAppendingString:@"}"];
    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:jsString];
    jsString = [result toSuccessCallbackString:command.callbackId];
    [self writeJavascript:jsString];
}

- (void)setSetting:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString* callbackID = [arguments pop];
	NSString* jsString;    
    CDVPluginResult* result;

    NSString *settingsName = [options objectForKey:@"key"];
    NSString *settingsValue = [options objectForKey:@"value"];

		
    @try 
    {
        [[NSUserDefaults standardUserDefaults] setValue:settingsValue forKey:settingsName];
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        jsString = [result toSuccessCallbackString:callbackID];
			
    }
    @catch (NSException * e) 
    {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsString:[e reason]];
        jsString = [result toErrorCallbackString:callbackID];
    }
    @finally 
    {
        [self writeJavascript:jsString]; //Write back to JS
    }
}

@end


