//
//  	VolumeSlider.m
//  	Volume Slider Cordova Plugin
//
//  	Created by Tommy-Carlos Williams on 20/07/11.
//  	Copyright 2011 Tommy-Carlos Williams. All rights reserved.
//      MIT Licensed
//

#import "VolumeSlider.h"

@implementation VolumeSlider

@synthesize mpVolumeViewParentView, myVolumeView, callbackId;

#ifndef __IPHONE_3_0
@synthesize webView;
#endif


-(CDVPlugin*) initWithWebView:(UIWebView*)theWebView
{
    self = (VolumeSlider*)[super initWithWebView:theWebView];
    return self;
}

- (void)dealloc
{	
	[mpVolumeViewParentView release];
	[myVolumeView release];
    [super dealloc];
}


#pragma mark -
#pragma mark VolumeSlider

- (IBAction) sliderValueChanged:(UISlider *)sender {
   // NSLog(@"%.1f", [sender value]);
    NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.volumeSlider._onSliderChanged(%.1f, %d);", [sender value], [sender tag]];
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction) sliderDragged:(UISlider *)sender {
    // NSLog(@"%.1f", [sender value]);
    NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.volumeSlider._onSliderDragged(%.1f, %d);", [sender value], [sender tag]];
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (void) resize:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	self.callbackId = arguments.pop;
	NSUInteger argc = [arguments count];
	
	if (argc < 3) { // at a minimum we need x origin, y origin and width...
		return;
	}
	
	CGFloat originx,originy,width;
    int sliderId;
	CGFloat height = 30;
	
	originx = [[arguments objectAtIndex:0] floatValue];
	originy = [[arguments objectAtIndex:1] floatValue];
	width = [[arguments objectAtIndex:2] floatValue];
	if (argc < 4) {
		height = [[arguments objectAtIndex:3] floatValue];
	}
    
    sliderId = [[arguments objectAtIndex:4] intValue];
    
	CGRect viewRect = CGRectMake(
								 originx,
								 originy,
								 width,
								 height
								 );
    
            UIView *sliderView = (UIView *)[[self.webView superview] viewWithTag:(sliderId)];
    
    if ( sliderView ) {
        

        sliderView.frame = viewRect;
        [sliderView setAutoresizesSubviews:YES ];

        
        UISlider *slider = (UISlider *)[[self.webView superview] viewWithTag:(sliderId+200)];
        [slider setAutoresizingMask:( UIViewAutoresizingFlexibleWidth |
                                     UIViewAutoresizingFlexibleHeight )];

        
    }
    

}

- (void) createVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{	
	self.callbackId = arguments.pop;
	NSUInteger argc = [arguments count];
	
	if (argc < 3) { // at a minimum we need x origin, y origin and width...
		return;	
	}
	
	CGFloat originx,originy,width;
    int sliderId;
	CGFloat height = 30;
	
	originx = [[arguments objectAtIndex:0] floatValue];
	originy = [[arguments objectAtIndex:1] floatValue];
	width = [[arguments objectAtIndex:2] floatValue];
	if (argc < 4) {
		height = [[arguments objectAtIndex:3] floatValue];
	}
    
    sliderId = [[arguments objectAtIndex:4] intValue];
    
	CGRect viewRect = CGRectMake(
								 originx, 
								 originy, 
								 width, 
								 height
								 );
	self.mpVolumeViewParentView = [[[UIView alloc] initWithFrame:viewRect] autorelease];

	[self.webView.superview addSubview:mpVolumeViewParentView];
	
	mpVolumeViewParentView.backgroundColor = [UIColor clearColor];
	self.myVolumeView = [[UISlider alloc] initWithFrame: mpVolumeViewParentView.bounds];

    
    mpVolumeViewParentView.tag = sliderId;
    [myVolumeView addTarget:self
               action:@selector(sliderValueChanged:)
     forControlEvents:UIControlEventTouchUpInside];
    
    [myVolumeView addTarget:self
                     action:@selector(sliderDragged:)
           forControlEvents:UIControlEventValueChanged];
    myVolumeView.tag = (sliderId+200);
    myVolumeView.minimumValue = 0;
    myVolumeView.maximumValue = 100;
	[mpVolumeViewParentView addSubview: myVolumeView];

}

- (void)showVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    CGFloat sliderId = [[arguments objectAtIndex:1] floatValue];
    [self.mpVolumeViewParentView viewWithTag:sliderId].hidden = NO;
    
}

- (void)hideVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    CGFloat sliderId = [[arguments objectAtIndex:1] floatValue];
    [self.mpVolumeViewParentView viewWithTag:sliderId].hidden = YES;
}

- (void)setVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    if ([arguments objectAtIndex:1] > 0) {
        float val = [[arguments objectAtIndex:1] floatValue];
        int sliderId = [[arguments objectAtIndex:2] intValue];
        UISlider *slider = (UISlider *)[[self.webView superview] viewWithTag:(sliderId+200)];
        [slider setValue:val animated:YES];
        
    }

}


@end
